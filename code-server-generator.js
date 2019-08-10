/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const fs = require('fs')
const path = require('path')
const codegen = require('./codegen-utils')

/**
 * Dart Code Generator
 */
class DartSereverCodeGenerator {
  /**
   * @constructor
   *
   * @param {type.UMLPackage} baseModel
   * @param {string} basePath generated files and directories to be placed
   */
  constructor (baseModel, basePath) {
    /** @member {type.Model} */
    this.baseModel = baseModel

    /** @member {string} */
    this.basePath = basePath
  }

  /**
   * Return Indent String based on options
   * @param {Object} options
   * @return {string}
   */
  getIndentString (options) {
    if (options.useTab) {
      return '\t'
    } else {
      var i, len
      var indent = []
      for (i = 0, len = options.indentSpaces; i < len; i++) {
        indent.push(' ')
      }
      return indent.join('')
    }
  }

  /**
   * Collect inheritances (super classes or interfaces) of a given element
   * @param {type.Model} elem
   * @return {Array.<type.Model>}
   */
  getInherits (elem) {
    var inherits = app.repository.getRelationshipsOf(elem, function (rel) {
      return (rel.source === elem && (rel instanceof type.UMLGeneralization || rel instanceof type.UMLInterfaceRealization))
    })
    return inherits.map(function (gen) { return gen.target })
  }

  /**
   * Write Doc
   * @param {StringWriter} codeWriter
   * @param {string} text
   * @param {Object} options
   */
  writeDoc (codeWriter, text, options) {
    var i, len, lines
    if (options.docString && text.trim().length > 0) {
      lines = text.trim().split('\n')
      if (lines.length > 1) {
        codeWriter.writeLine('///"""')
        for (i = 0, len = lines.length; i < len; i++) {
          codeWriter.writeLine(lines[i])
        }
        codeWriter.writeLine('///"""')
      } else {
        codeWriter.writeLine('///"""' + lines[0] + '"""')
      }
    }
  }

 

  /**
   * Write getFunction
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeGetFunction (codeWriter, elem, options) {
    var hasBody = false
    codeWriter.indent()

   // from attributes

   if (elem.attributes.length > 0) {
    elem.attributes.forEach(function (attr) {
      if (attr.isStatic === false) {
        var nameStr= codeWriter.getFunctionStr(attr.name)
        codeWriter.writeLine(attr.type+' get'+nameStr+'() {')
        codeWriter.writeLine('return super.get("'+attr.name+'");')
        codeWriter.writeLine('}')
        hasBody = true
      }
    })
  }
  codeWriter.writeLine()
  }


  

/**
   * Write setFunction
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeSetFunction (codeWriter, elem, options) {
    var hasBody = false
    codeWriter.indent()
    
   // from attributes

   if (elem.attributes.length > 0) {
    elem.attributes.forEach(function (attr) {
      if (attr.isStatic === false) {
        var nameStr= codeWriter.getFunctionStr(attr.name)
        codeWriter.writeLine('void set'+nameStr+'('+attr.type+' ' +attr.name+') {')
        codeWriter.writeLine('this.put("'+attr.name+'", '+attr.name+');')
        codeWriter.writeLine('}')
        hasBody = true
      }
    })
  }
  codeWriter.writeLine()
  }


  /**
   * Write Method
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   * @param {boolean} skipBody
   * @param {boolean} skipParams
   */
  writeMethod (codeWriter, elem, options) {
    if (elem.name.length > 0) {
      // name
      var line = 'def ' + elem.name

      // params
      var params = elem.getNonReturnParameters()
      var paramStr = params.map(function (p) { return p.name }).join(', ')

      if (elem.isStatic) {
        codeWriter.writeLine('@classmethod')
        codeWriter.writeLine(line + '(cls, ' + paramStr + '):')
      } else {
        codeWriter.writeLine(line + '(self, ' + paramStr + '):')
      }
      codeWriter.indent()
      this.writeDoc(codeWriter, elem.documentation, options)
      codeWriter.writeLine('pass')
      codeWriter.outdent()
      codeWriter.writeLine()
    }
  }

  /**
   * Write Enum
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeEnum (codeWriter, elem, options) {
    var line = ''

    codeWriter.writeLine('from enum import Enum')
    codeWriter.writeLine()

    // Enum
    line = 'class ' + elem.name + '(Enum):'
    codeWriter.writeLine(line)
    codeWriter.indent()

    // Docstring
    this.writeDoc(codeWriter, elem.documentation, options)

    if (elem.literals.length === 0) {
      codeWriter.writeLine('pass')
    } else {
      for (var i = 0, len = elem.literals.length; i < len; i++) {
        codeWriter.writeLine(elem.literals[i].name + ' = ' + (i + 1))
      }
    }
    codeWriter.outdent()
    codeWriter.writeLine()
  }

  /**
   * Write Class
   * @param {StringWriter} codeWriter
   * @param {type.Model} elem
   * @param {Object} options
   */
  writeClass (codeWriter, elem, options) {
    var self = this
    var line = ''
    var _inherits = this.getInherits(elem)
    var prefix=options.prefix
    // Import
    if (_inherits.length > 0) {
      _inherits.forEach(function (e) {
        var _path = e.getPath(self.baseModel).map(function (item) { return item.name }).join('.')
        codeWriter.writeLine('from ' + _path + ' import ' + e.name)
      })
      codeWriter.writeLine()
    }
    var upStr=codeWriter.getFunctionStr(elem.name);
    // Class
    line = 'class ' +prefix+ upStr + ' extends AVObject '

    // Inherits
    if (_inherits.length > 0) {
      line += '(' + _inherits.map(function (e) { return e.name }).join(', ') + ')'
    }
    codeWriter.writeLine(line + '{')
    codeWriter.writeLine()
    codeWriter.writeLine(prefix+ upStr+'() : super("'+elem.name+'");')
    codeWriter.writeLine()
    codeWriter.writeLine( prefix+ upStr+'.fromQueryBackString(String queriedString)')
    codeWriter.writeLine( ': super.fromQueryBackString(queriedString);')
 
    codeWriter.indent()

    // Docstring
    this.writeDoc(codeWriter, elem.documentation, options)

    if (elem.attributes.length === 0 && elem.operations.length === 0) {
      codeWriter.writeLine('pass')
    } else {
     // putFunction
     codeWriter.writeLine('void put(String key, Object value) {')
     codeWriter.writeLine('super.put(key, value);')
     codeWriter.writeLine('}')
     
     codeWriter.writeLine()
      // setFunction
      this.writeSetFunction(codeWriter, elem, options)
      // getFunction
      this.writeGetFunction(codeWriter, elem, options)
      codeWriter.writeLine()
      // saveFunction
      codeWriter.writeLine('Future<'+prefix+ upStr+'> save() async {')
      codeWriter.writeLine('super.save();')
      codeWriter.writeLine('return this;')
      codeWriter.writeLine('}')
      
      
     


      codeWriter.writeLine()
      // Methods
      if (elem.operations.length > 0) {
        elem.operations.forEach(function (op) {
          self.writeMethod(codeWriter, op, options)
        })
      }
    }
    codeWriter.outdent()
    codeWriter.writeLine()
    codeWriter.writeLine('}')
    codeWriter.writeLine()
  }

  /**
   * Generate codes from a given element
   * @param {type.Model} elem
   * @param {string} path
   * @param {Object} options
   */
  generate (elem, basePath, options) {
    var result = new $.Deferred()
    var fullPath, codeWriter, file
    
    // Package (a directory with __init__.dart)
    if (elem instanceof type.UMLPackage) {
      fullPath = path.join(basePath, elem.name)
      fs.mkdirSync(fullPath)
      file = path.join(fullPath, '__init__.dart')
      fs.writeFileSync(file, '')
      elem.ownedElements.forEach(child => {
        this.generate(child, fullPath, options)
      })

    // Class
    } else if (elem instanceof type.UMLClass || elem instanceof type.UMLInterface) {
      codeWriter = new codegen.CodeWriter(this.getIndentString(options))
      var prefix=options.prefix
      var upStr=codeWriter.getFunctionStr(elem.name)
      fullPath = basePath + '/' + prefix+upStr + '.dart'
      
 
      codeWriter.writeLine('import \'dart:async\';')

      codeWriter.writeLine()
      codeWriter.writeLine('import \'package:leancloud_functions\/leancloud_functions.dart\';')
      
      codeWriter.writeLine()
      this.writeClass(codeWriter, elem, options)
      fs.writeFileSync(fullPath, codeWriter.getData())

    // Enum
    } else if (elem instanceof type.UMLEnumeration) {
      codeWriter = new codegen.CodeWriter(this.getIndentString(options))
      var prefix=options.prefix
      var upStr=codeWriter.getFunctionStr(elem.name)
      fullPath = basePath + '/' + prefix+ upStr+ '.dart'
      

      codeWriter.writeLine()
      this.writeEnum(codeWriter, elem, options)
      fs.writeFileSync(fullPath, codeWriter.getData())

    // Others (Nothing generated.)
    } else {
      result.resolve()
    }
    return result.promise()
  }
}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate_server (baseModel, basePath, options) {
  var fullPath
  var dartSereverCodeGenerator = new DartSereverCodeGenerator(baseModel, basePath)
  fullPath = basePath + '/' + baseModel.name
  fs.mkdirSync(fullPath)
  baseModel.ownedElements.forEach(child => {
    dartSereverCodeGenerator.generate(child, fullPath, options)
  })
}

exports.generate_serever = generate_server
