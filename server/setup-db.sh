#!/bin/bash
# MealDrama PostgreSQL Setup Script for macOS with Docker

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MealDrama PostgreSQL Database Setup                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker Desktop for macOS${NC}"
    echo "  Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if PostgreSQL container is already running
if docker ps --format '{{.Names}}' | grep -q mealdrama-db; then
    echo -e "${GREEN}✓ PostgreSQL container 'mealdrama-db' is already running${NC}"
    echo ""
    echo "Database is ready at:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: mealdrama_dev"
    echo "  User: mealdrama_user"
    echo "  Password: mealdrama_password"
    exit 0
fi

# Start PostgreSQL container
echo -e "${BLUE}Starting PostgreSQL container...${NC}"

docker run -d \
  --name mealdrama-db \
  -e POSTGRES_USER=mealdrama_user \
  -e POSTGRES_PASSWORD=mealdrama_password \
  -e POSTGRES_DB=mealdrama_dev \
  -p 5432:5432 \
  -v mealdrama-db-data:/var/lib/postgresql/data \
  postgres:15-alpine

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL container started successfully${NC}"
    
    # Wait for database to be ready
    echo -e "${BLUE}Waiting for database to be ready...${NC}"
    sleep 3
    
    echo ""
    echo -e "${GREEN}✓ Database is ready!${NC}"
    echo ""
    echo "Connection Details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: mealdrama_dev"
    echo "  User: mealdrama_user"
    echo "  Password: mealdrama_password"
    echo ""
    echo "Useful Docker commands:"
    echo "  View logs: docker logs mealdrama-db"
    echo "  Stop: docker stop mealdrama-db"
    echo "  Start: docker start mealdrama-db"
    echo "  Remove: docker rm mealdrama-db"
else
    echo -e "${RED}✗ Failed to start PostgreSQL container${NC}"
    exit 1
fi
