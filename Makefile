.PHONY: build install uninstall enable disable start stop restart status update clean dev nginx nginx-uninstall

PREFIX ?= /opt/startpage
SERVICE_DIR ?= $(HOME)/.config/systemd/user
SERVICE_NAME = startpage.service
PORT ?= 51991
HOST ?= 127.0.0.1
DOMAIN ?= startpage.local
NGINX_CONF ?= /etc/nginx/nginx.conf
NGINX_SITES ?= /etc/nginx/sites-enabled

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

# Serve the page at http://$(DOMAIN) instead of a port number. Idempotent:
# safe to run again, and it validates the config before reloading nginx.
nginx:
	sudo mkdir -p $(NGINX_SITES)
	sed -e 's|proxy_pass http://localhost:.*;|proxy_pass http://localhost:$(PORT);|' \
	    -e 's|server_name .*;|server_name $(DOMAIN);|' \
	    resources/startpage.local | sudo tee $(NGINX_SITES)/$(DOMAIN) > /dev/null
	@grep -q '$(NGINX_SITES)' $(NGINX_CONF) || { \
	    echo "Adding the sites-enabled include to $(NGINX_CONF) (backup: $(NGINX_CONF).bak)"; \
	    sudo cp $(NGINX_CONF) $(NGINX_CONF).bak; \
	    sudo sed -i '0,/^http {/s||http {\n    include $(NGINX_SITES)/*;|' $(NGINX_CONF); }
	@grep -q '[[:space:]]$(DOMAIN)$$' /etc/hosts || echo "127.0.0.1 $(DOMAIN)" | sudo tee -a /etc/hosts > /dev/null
	sudo nginx -t
	sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload
	@echo "Ready at http://$(DOMAIN)"

nginx-uninstall:
	sudo rm -f $(NGINX_SITES)/$(DOMAIN)
	@tmp=$$(mktemp); grep -v '[[:space:]]$(DOMAIN)$$' /etc/hosts > $$tmp; sudo cp $$tmp /etc/hosts; rm -f $$tmp
	sudo nginx -t && { sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload; }

update: build
	@echo "Updating $(PREFIX)..."
	cp -r build $(PREFIX)/build
	cp package.json $(PREFIX)/
	cd $(PREFIX) && npm install --omit=dev
	systemctl --user restart $(SERVICE_NAME)
	@echo "Updated and restarted."
