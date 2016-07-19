ifneq ($(npm_lifecycle_event), heroku-postbuild)
	-include .env.mk
endif

SHELL := /bin/bash

BUILD = build
SRC = src

EMAIL_ONLY_SIGNUP = bower_components/o-email-only-signup/src/email-only-signup.js

JS_FILES = $(shell find $(SRC) -name '*.js')
SRC_FILES = $(JS_FILES) $(EMAIL_ONLY_SIGNUP)
BUILD_FILES = $(patsubst %, $(BUILD)/%, $(SRC_FILES))
BUILD_DIRS = $(patsubst %/, %, $(dir $(BUILD_FILES)))

npm_bin = $(addprefix $(shell npm bin)/, $(1))

BABEL_OPTS =
BROWSERIFY_OPTS = -t [ babelify $(BABEL_OPTS) --presets es2015 ] -t debowerify
ESLINT_OPTS = --fix
LINTSPACE_OPTS = -n -d tabs -l 2
POST_SASS_OPTS = --cssPath public --postCss autoprefixer

ifeq (,$(wildcard .env))
FASTLY_OPTS = --service FASTLY_SERVICE vcl
else
FASTLY_OPTS = --env --service FASTLY_SERVICE vcl
endif

HEROKU_CONFIG_OPTS = -i NODE_ENV -i HEROKU
HEROKU_CONFIG_APP = distro-light-signup-staging

all: babel public/style.css public/main.js

# server build
babel: $(BUILD_DIRS) $(BUILD_FILES)

$(BUILD)/%.js: ./%.js
	$(call npm_bin, babel) $(BABEL_OPTS) $< -o $@

# client build
public/%.js: client/%.js
	$(call npm_bin, browserify) $(BROWSERIFY_OPTS) -o $@ $<

public/style.css: scss/style.scss bower_components
	$(call npm_bin, post-sass) $(POST_SASS_OPTS)

# installation
bower_components/%: bower.json
	$(call npm_bin, bower) install

# utility

$(BUILD):
	mkdir -p $@

$(BUILD)/%: % clean-$(BUILD)/%
	mkdir -p $@

clean-$(BUILD)/%:
	$(eval BUILD_THINGS := $(patsubst $(BUILD)/%, %, $(wildcard $(BUILD)/$*/*)))
	$(eval SRC_THINGS := $(patsubst ./%, %, $(wildcard ./$*/*)))
	$(eval TO_DELETE := $(addprefix $(BUILD)/, $(shell comm -23 <(echo $(BUILD_THINGS) | tr ' ' '\n' | sort) <(echo $(SRC_THINGS) | tr ' ' '\n' | sort))))
	$(if $(TO_DELETE), rm $(TO_DELETE))

clean:
	rm -rf $(BUILD)

# test things
lintspace: $(LINTSPACE_FILES)
	$(call npm_bin, lintspaces) $(LINTSPACE_OPTS) $^

lint: $(JS_FILES) $(TEST_FILES) $(TEST_UTILS)
	$(call npm_bin, eslint) $(ESLINT_OPTS) $^

test: lint lintspace

# heroku and fastly
promote:
	$(MAKE) -B HEROKU_CONFIG_APP=distro-light-signup-prod .env deploy-vcl
	$(MAKE) -B .env
	heroku pipelines:promote -a distro-light-signup-staging --to distro-light-signup-prod

deploy-vcl:
	$(if $(FASTLY_APIKEY), $(call npm_bin, fastly) deploy $(FASTLY_OPTS), @echo '⤼ No Fastly API key, not deploying VCL')

# local config
.env:
	$(call npm_bin, heroku-config-to-env) $(HEROKU_CONFIG_OPTS) $(HEROKU_CONFIG_APP) $@

.env.mk: .env
	sed 's/"//g ; s/=/:=/' < $< > $@

.PHONY: clean lint lintspace test promote deploy-vcl
