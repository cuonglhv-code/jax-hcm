.PHONY: dev build test seed migrate docker-up docker-down docker-logs

dev:
	npm run dev

build:
	npm run build

test:
	cd server && npm test
	cd client && npm test

seed:
	cd server && npm run seed

migrate:
	cd server && npm run migrate

migrate-rollback:
	cd server && npm run migrate:rollback

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

docker-shell:
	docker-compose exec app sh

docker-db:
	docker-compose exec postgres psql -U hcm_user -d jax_hcm

reset-db:
	cd server && npm run migrate:rollback && npm run migrate && npm run seed
