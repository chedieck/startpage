.PHONY: build install uninstall enable disable start stop restart status update clean dev

PREFIX ?= /opt/startpage
SERVICE_DIR ?= $(HOME)/.config/systemd/user
SERVICE_NAME = startpage.service
PORT ?= 51991
HOST ?= 127.0.0.1

build:
	npm run build

dev:
	npm run dev

clean:
	rm -rf build node_modules .svelte-kit

install: build
	@echo "Installing to $(PREFIX)..."
	mkdir -p $(PREFIX)
	cp -r build $(PREFIX)/build
	cp package.json $(PREFIX)/
	cd $(PREFIX) && npm install --omit=dev
	mkdir -p $(SERVICE_DIR)
	sed -e 's|WorkingDirectory=.*|WorkingDirectory=$(PREFIX)|' \
	    -e 's|Environment=PORT=.*|Environment=PORT=$(PORT)|' \
	    -e 's|Environment=HOST=.*|Environment=HOST=$(HOST)|' \
	    resources/startpage.service > $(SERVICE_DIR)/$(SERVICE_NAME)
	systemctl --user daemon-reload
	@echo "Installed. Run 'make enable start' to activate."

uninstall: stop disable
	rm -f $(SERVICE_DIR)/$(SERVICE_NAME)
	rm -rf $(PREFIX)
	systemctl --user daemon-reload
	@echo "Uninstalled."

enable:
	systemctl --user enable $(SERVICE_NAME)

disable:
	systemctl --user disable $(SERVICE_NAME)

start:
	systemctl --user start $(SERVICE_NAME)

stop:
	systemctl --user stop $(SERVICE_NAME)

restart:
	systemctl --user restart $(SERVICE_NAME)

status:
	systemctl --user status $(SERVICE_NAME)

update: build
	@echo "Updating $(PREFIX)..."
	cp -r build $(PREFIX)/build
	cp package.json $(PREFIX)/
	cd $(PREFIX) && npm install --omit=dev
	systemctl --user restart $(SERVICE_NAME)
	@echo "Updated and restarted."
