.PHONY: compile-deps sync-deps test lint

compile-deps:
	pip-compile requirements.in
	pip-compile dev-requirements.in

sync-deps:
	pip-sync requirements.txt dev-requirements.txt

test:
	pytest

lint:
	flake8 .
	black --check .
	isort --check-only .

format:
	black .
	isort .
