'use strict';

const nj = require('nornj'),
  includeParser = require('nornj/src/parser/includeParser'),
  loaderUtils = require('loader-utils');

function buildTmplFns(fns) {
  let ret = '{\n';
  nj.each(fns, (v, k, i, l) => {
    if (k.indexOf('_') != 0) {
      ret += '  ' + k + ': ' + v.toString() + (i < l - 1 ? ',' : '') + '\n';
    }
  });
  return ret + '}';
}

function getCompileFnName(outputH) {
  return outputH ? 'compileH' : 'compile';
}

module.exports = function (source) {
  const options = loaderUtils.parseQuery(this.query),
    resourceOptions = loaderUtils.parseQuery(this.resourceQuery);

  this.cacheable && this.cacheable();

  //Set delimiter rule of templates
  nj.setTmplRule({
    start: options.startRule,
    end: options.endRule,
    expr: options.exprRule,
    external: options.externalRule,
    prop: options.propRule,
    template: options.templateRule
  });

  //Set configs for expressions and filters
  if (options.exprConfig) {
    let exprConfig = {};
    nj.each(options.exprConfig, (v, k) => {
      exprConfig[k] = {
        options: v
      };
    });

    nj.registerExpr(exprConfig);
  }
  if (options.filterConfig) {
    let filterConfig = {};
    nj.each(options.filterConfig, (v, k) => {
      filterConfig[k] = {
        options: v
      };
    });

    nj.registerFilter(filterConfig);
  }

  //Parse the "include" and "template" block
  let tmpls = includeParser(source, this.resourcePath, true),
    tmplNames = Object.keys(tmpls),
    output = '';

  //Precompiling template
  if (tmplNames.length == 1 && tmplNames[0] === 'main') {
    if (tmpls.main.trim().length > 0) {
      if (resourceOptions.raw) {
        output += `nj(${JSON.stringify(tmpls.main)});`;
      }
      else if (resourceOptions.compiled) {
        output += 'nj.' + getCompileFnName(options.outputH) + '(' + buildTmplFns(nj.precompile(tmpls.main, options.outputH)) + ');';
      }
      else {
        output += buildTmplFns(nj.precompile(tmpls.main, options.outputH)) + ';';
      }
    }
  }
  else {  //Output multiple templates
    var tmplsStr = '';
    nj.each(tmpls, (tmpl, name, i, l) => {
      if (tmpl.trim().length > 0) {
        tmplsStr += '  ' + name + ': ';

        if (resourceOptions.raw) {
          tmplsStr += `nj(${JSON.stringify(tmpl)})`;
        }
        else if (resourceOptions.compiled) {
          tmplsStr += 'nj.' + getCompileFnName(options.outputH) + '(' + buildTmplFns(nj.precompile(tmpl, options.outputH)) + ')';
        }
        else {
          tmplsStr += buildTmplFns(nj.precompile(tmpl, options.outputH));
        }

        tmplsStr += (i < l - 1 ? ',' : '') + '\n';
      }
    });
    output += `{\n${tmplsStr}};`;
  }

  return '\'use strict\';\n\n'
    + ((resourceOptions.raw || resourceOptions.compiled) ? 'var nj = require(\'nornj\');\n\n' : '')
    + `module.exports = ${output}`;
};