# Ruby on Rails Conventions (Agent-Friendly)

## Project Structure

```
app/
├── controllers/
│   ├── application_controller.rb
│   └── users_controller.rb
├── models/
│   ├── application_record.rb
│   └── user.rb
├── services/                    # Business logic (non-Rails convention)
│   └── users/
│       ├── create_user.rb
│       └── update_user.rb
├── queries/                     # Complex queries (optional)
│   └── users/
│       └── active_users_query.rb
├── serializers/                 # JSON serialization
│   └── user_serializer.rb
├── validators/                  # Custom validators
│   └── email_validator.rb
├── errors/                      # Custom errors
│   └── user_not_found_error.rb
├── jobs/
│   └── send_welcome_email_job.rb
└── mailers/
    └── user_mailer.rb
config/
├── routes.rb
└── initializers/
db/
├── migrate/
└── seeds.rb
spec/                            # or test/
├── models/
├── controllers/
├── services/
└── factories/
```

Rules:
- Follow Rails conventions where they exist
- Add `services/` for business logic outside models
- Add `queries/` for complex database queries
- Keep models lean

## Models

### Lean models with validations and associations

```ruby
# app/models/user.rb
class User < ApplicationRecord
  # Enums
  enum :role, { member: 'member', manager: 'manager', admin: 'admin' }

  # Associations
  has_many :posts, dependent: :destroy
  belongs_to :organization

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true, length: { maximum: 255 }
  validates :role, presence: true

  # Scopes
  scope :active, -> { where(active: true) }
  scope :admins, -> { where(role: :admin) }
  scope :created_after, ->(date) { where('created_at > ?', date) }

  # Callbacks (use sparingly)
  before_validation :normalize_email

  private

  def normalize_email
    self.email = email&.downcase&.strip
  end
end
```

Rules:
- No business logic in models (use services)
- Use scopes for reusable queries
- Use enum for fixed value sets
- Validate at model level

## Services

### Service objects for business logic

```ruby
# app/services/users/create_user.rb
module Users
  class CreateUser
    def initialize(user_repo: User, mailer: UserMailer)
      @user_repo = user_repo
      @mailer = mailer
    end

    def call(params)
      user = @user_repo.new(params)

      ActiveRecord::Base.transaction do
        user.save!
        @mailer.welcome(user).deliver_later
      end

      Result.success(user)
    rescue ActiveRecord::RecordInvalid => e
      Result.failure(e.record.errors)
    end
  end
end

# Usage in controller
Users::CreateUser.new.call(user_params)
```

### Result object pattern

```ruby
# app/services/result.rb
class Result
  attr_reader :value, :errors

  def initialize(success:, value: nil, errors: nil)
    @success = success
    @value = value
    @errors = errors
  end

  def success?
    @success
  end

  def failure?
    !@success
  end

  def self.success(value)
    new(success: true, value: value)
  end

  def self.failure(errors)
    new(success: false, errors: errors)
  end
end
```

## Controllers

### Thin controllers

```ruby
# app/controllers/users_controller.rb
class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: %i[show update destroy]

  def index
    users = User.active.page(params[:page])
    render json: UserSerializer.new(users).serializable_hash
  end

  def show
    render json: UserSerializer.new(@user).serializable_hash
  end

  def create
    result = Users::CreateUser.new.call(user_params)

    if result.success?
      render json: UserSerializer.new(result.value).serializable_hash, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_entity
    end
  end

  def update
    result = Users::UpdateUser.new.call(@user, user_params)

    if result.success?
      render json: UserSerializer.new(result.value).serializable_hash
    else
      render json: { errors: result.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @user.destroy!
    head :no_content
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :email, :role)
  end
end
```

Rules:
- Use `before_action` for common setup
- Delegate logic to services
- Use strong parameters
- Return appropriate HTTP status codes

## Serializers (jsonapi-serializer or similar)

```ruby
# app/serializers/user_serializer.rb
class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :email, :role, :created_at

  attribute :active do |user|
    user.active?
  end

  has_many :posts
end
```

## Custom Errors

```ruby
# app/errors/user_not_found_error.rb
class UserNotFoundError < StandardError
  attr_reader :user_id

  def initialize(user_id)
    @user_id = user_id
    super("User not found: #{user_id}")
  end
end

# Handle in ApplicationController
class ApplicationController < ActionController::API
  rescue_from UserNotFoundError, with: :handle_not_found
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  private

  def handle_not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end
end
```

## Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :users, only: %i[index show create update destroy] do
        member do
          post :activate
          post :deactivate
        end
        collection do
          get :search
        end
      end
    end
  end
end
```

## Queries

### For complex queries

```ruby
# app/queries/users/active_users_query.rb
module Users
  class ActiveUsersQuery
    def initialize(relation = User.all)
      @relation = relation
    end

    def call(role: nil, created_after: nil)
      scope = @relation.active

      scope = scope.where(role: role) if role.present?
      scope = scope.where('created_at > ?', created_after) if created_after.present?

      scope.order(created_at: :desc)
    end
  end
end

# Usage
Users::ActiveUsersQuery.new.call(role: :admin, created_after: 1.week.ago)
```

## Jobs

```ruby
# app/jobs/send_welcome_email_job.rb
class SendWelcomeEmailJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  def perform(user_id)
    user = User.find(user_id)
    UserMailer.welcome(user).deliver_now
  end
end
```

## Testing (RSpec)

```ruby
# spec/services/users/create_user_spec.rb
RSpec.describe Users::CreateUser do
  describe '#call' do
    subject(:service) { described_class.new }

    let(:valid_params) do
      { name: 'John', email: 'john@example.com', password: 'password123' }
    end

    context 'with valid params' do
      it 'creates a user' do
        result = service.call(valid_params)

        expect(result).to be_success
        expect(result.value).to be_persisted
        expect(result.value.email).to eq('john@example.com')
      end

      it 'sends a welcome email' do
        expect { service.call(valid_params) }
          .to have_enqueued_mail(UserMailer, :welcome)
      end
    end

    context 'with invalid params' do
      it 'returns failure' do
        result = service.call(valid_params.merge(email: ''))

        expect(result).to be_failure
        expect(result.errors[:email]).to include("can't be blank")
      end
    end
  end
end
```

### Factories (FactoryBot)

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    role { :member }
    active { true }

    trait :admin do
      role { :admin }
    end

    trait :inactive do
      active { false }
    end
  end
end

# Usage
create(:user)
create(:user, :admin)
create(:user, :inactive, name: 'Specific Name')
```

## Migrations

```ruby
# db/migrate/20240101000000_create_users.rb
class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :role, null: false, default: 'member'
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :role
    add_index :users, :active
  end
end
```

See [languages/ruby.md](../../languages/ruby.md) for Ruby-specific conventions (when available).
