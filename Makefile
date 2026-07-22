.PHONY: dev build up down logs url rebuild clean generate-images optimize-images

dev:
	npm run dev -- --host 0.0.0.0 --port 5173

build:
	docker compose build

up: build
	docker compose up -d
	@echo "App running at http://localhost:3020"

down:
	docker compose down

logs:
	docker compose logs -f app

url:
	@echo "http://localhost:3020"

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

clean:
	docker compose down -v
	rm -rf node_modules .svelte-kit build

generate-images:
	python3 scripts/generate-images.py $(ARGS)

optimize-images:
	npm run optimize:images -- $(ARGS)

install:
	npm install
