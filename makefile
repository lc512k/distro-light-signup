-include .env.mk

SHELL := /bin/bash

SRC = src
LIB = lib

SRC_FILES = $(shell find $(SRC) -name '*.js')
LIB_FILES = $(patsubst $(SRC)/%.js, $(LIB)/%.js, $(SRC_FILES)) $(LIB)/bower/o-email-only-signup.js
LIB_DIRS = $(dir $(LIB_FILES))

npm_bin = $(addprefix $(shell npm bin)/, $(1))

BABEL_OPTS = --presets es2015
BROWSERIFY_OPTS = -t [ babelify $(BABEL_OPTS) ] -t debowerify
ESLINT_OPTS = --fix
LINTSPACE_OPTS = -n -d tabs -l 2
POST_SASS_OPTS = --cssPath public --postCss autoprefixer

HEROKU_CONFIG_APP = distro-light-signup-staging

all: babel public/style.css public/main.js

babel: $(LIB) $(LIB_DIRS) $(LIB_FILES)

$(LIB)/bower: bower_components
	mkdir -p $@

$(LIB)/bower/o-email-only-signup.js: bower_components/o-email-only-signup/src/email-only-signup.js
	$(call npm_bin, babel) $(BABEL_OPTS) $< -o $@

$(LIB)/%.js: $(SRC)/%.js
	$(call npm_bin, babel) $(BABEL_OPTS) $< -o $@

$(LIB)/%: $(SRC)/% clean-$(LIB)/%
	mkdir -p $@

$(LIB): $(SRC)
	mkdir -p $@

clean-$(LIB)/%:
	$(eval LIB_THINGS := $(patsubst $(LIB)/%, %, $(wildcard $(LIB)/$*/*)))
	$(eval SRC_THINGS := $(patsubst $(SRC)/%, %, $(wildcard $(SRC)/$*/*)))
	$(eval TO_DELETE := $(addprefix $(LIB)/, $(shell comm -23 <(echo $(LIB_THINGS) | tr ' ' '\n' | sort) <(echo $(SRC_THINGS) | tr ' ' '\n' | sort))))
	$(if $(TO_DELETE), rm $(TO_DELETE))

public/%.js: client/%.js
	$(call npm_bin, browserify) $(BROWSERIFY_OPTS) -o $@ $<

public/style.css: scss/style.scss bower_components
	$(call npm_bin, post-sass) $(POST_SASS_OPTS)

bower_components: bower.json
	$(call npm_bin, bower) install

clean:
	rm -rf $(LIB)

.env:
	$(call npm_bin, heroku-config-to-env) -i NODE_ENV -i HEROKU $(HEROKU_CONFIG_APP) $@

lintspace: $(LINTSPACE_FILES)
	$(call npm_bin, lintspace) $(LINTSPACE_OPTS) $^

lint: $(SRC_FILES) $(TEST_FILES) $(TEST_UTILS)
	$(call npm_bin, eslint) $(ESLINT_OPTS) $^

promote:
	$(MAKE) -B HEROKU_CONFIG_APP=distro-light-signup-prod .env deploy-vcl
	$(MAKE) -B .env
	heroku pipelines:promote -a distro-light-signup-staging --to distro-light-signup-prod

deploy-vcl:
	$(if $(FASTLY_APIKEY), $(call npm_bin, fastly) deploy --env --service FASTLY_SERVICE vcl)

.env.mk: .env
	sed 's/"//g ; s/=/:=/' < $< > $@

test: lint lintspace babel

.PHONY: clean lint lintspace test promote deploy-vcl
