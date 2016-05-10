SHELL := /bin/bash

SRC = src
LIB = lib

SRC_FILES = $(shell find $(SRC) -name '*.js')
LIB_FILES = $(patsubst $(SRC)/%.js, $(LIB)/%.js, $(SRC_FILES))
LIB_DIRS = $(dir $(LIB_FILES))

NPM_BIN := $(shell npm bin)

BABEL = $(NPM_BIN)/babel
BABEL_OPTS =

ESLINT = $(NPM_BIN)/eslint
ESLINT_OPTS = --fix

LINTSPACE = $(NPM_BIN)/lintspaces
LINTSPACE_OPTS = -n -d tabs -l 2

POST_SASS = $(NPM_BIN)/post-sass
POST_SASS_OPTS = --cssPath public

all: babel

babel: $(LIB) $(LIB_DIRS) $(LIB_FILES)

$(LIB)/%.js: $(SRC)/%.js
	$(BABEL) $(BABEL_OPTS) $< -o $@

$(LIB)/%: $(SRC)/% clean-$(LIB)/%
	mkdir -p $@

$(LIB): $(SRC)
	mkdir -p $@

clean-$(LIB)/%:
	$(eval LIB_THINGS := $(patsubst $(LIB)/%, %, $(wildcard $(LIB)/$*/*)))
	$(eval SRC_THINGS := $(patsubst $(SRC)/%, %, $(wildcard $(SRC)/$*/*)))
	$(eval TO_DELETE := $(addprefix $(LIB)/, $(shell comm -23 <(echo $(LIB_THINGS) | tr ' ' '\n' | sort) <(echo $(SRC_THINGS) | tr ' ' '\n' | sort))))
	$(if $(TO_DELETE), rm $(TO_DELETE))

public/style.css: scss/style.scss
	$(POST_SASS) $(POST_SASS_OPTS)

clean:
	rm -rf $(LIB)

lintspace: $(LINTSPACE_FILES)
	$(LINTSPACE) $(LINTSPACE_OPTS) $^

lint: $(SRC_FILES) $(TEST_FILES) $(TEST_UTILS)
	$(ESLINT) $(ESLINT_OPTS) $^

test: lint lintspace babel

.PHONY: clean lint lintspace test
