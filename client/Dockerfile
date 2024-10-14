# Use the official Bun image as the base
FROM oven/bun:1

# Set the working directory in the container
WORKDIR /app

# Copy package.json, bun.lockb, and configuration files
COPY package.json bun.lockb* postcss.config.js tailwind.config.js ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Verify that Tailwind CSS is installed
RUN bun x tailwindcss --help

# Expose the port that the dev server will run on
EXPOSE 5173

# Command to run the development server
CMD ["bun", "run", "vite", "--host", "0.0.0.0", "--port", "5173"]
