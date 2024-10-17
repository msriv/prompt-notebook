# Base image for both Python and Bun
FROM oven/bun:1-debian

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

# Install Python dependencies
COPY requirements.in .
RUN pip3 install pip-tools
RUN pip-compile requirements.in && pip3 install -r requirements.txt

# Install Bun dependencies for React app
WORKDIR /app/client
COPY client/package.json client/bun.lockb ./
RUN bun install

# Copy the rest of the application
WORKDIR /app
COPY . .

# Install Supervisor
RUN apt-get install -y supervisor

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose ports for Python backend and React dev server
EXPOSE 8000 3000

# Copy and set permissions for the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Start Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
