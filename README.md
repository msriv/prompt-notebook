# Prompt Notebook

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Prompt Notebook is a project that allows users to manage and organize prompts for their Gen AI applications. It provides a user-friendly interface for creating, editing, and storing prompts. Prompt notebook follows an API-First architecture so it is seamlessly integratable with your services.

## Table of Contents

- [Features](#features)
- [Setup](#setup)
  - [Manual Setup](#manual-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features

- Create and manage prompts for different AI models
- Organize prompts into categories or notebooks
- Integration with OpenAI and Anthropic AI services
- User-friendly web interface
- Secure authentication and authorization

## Setup

There are two ways to set up the Prompt Notebook project: manual setup and using Docker Compose.

### Manual Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/prompt-notebook.git
   cd prompt-notebook
   ```

2. Set up a Python virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Install and set up PostgreSQL:
   - Install PostgreSQL on your system
   - Create a new database and user for the project

5. Install and start Redis:
   - Install Redis on your system
   - Start the Redis server

6. Set up the React frontend:
   ```
   cd client
   npm install
   ```

7. Create a `.env` file in the root directory and add the necessary environment variables (see [Environment Variables](#environment-variables) section).

8. Run database migrations:
   ```
   python manage.py migrate
   ```

9. Start the backend server:
   ```
   python manage.py runserver
   ```

10. In a separate terminal, start the frontend development server:
    ```
    cd client
    npm start
    ```

### Docker Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/prompt-notebook.git
   cd prompt-notebook
   ```

2. Create a `.env` file in the root directory and add the necessary environment variables (see [Environment Variables](#environment-variables) section).

3. Build and start the Docker containers:
   ```
   docker-compose up --build
   ```

This will start all the necessary services: the web application, PostgreSQL database, Redis, and pgAdmin.

## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=prompt_notebook
DATABASE_URL=postgresql://admin:password@postgres/prompt_notebook
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Replace `your_openai_api_key` and `your_anthropic_api_key` with your actual API keys for OpenAI and Anthropic services.

## Contributing

We welcome contributions to the Prompt Notebook project! Here's how you can contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with descriptive commit messages
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure that your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```

This README provides a comprehensive overview of the Prompt Notebook project, including setup instructions for both manual and Docker-based installations, environment variable details, contribution guidelines, and license information. You can further customize it based on any additional features or requirements specific to your project.
