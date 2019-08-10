Dart Extension for StarUML
============================

This extension for StarUML(http://staruml.io) support to generate Dart code from UML model. Install this extension from Extension Manager of StarUML.

Dart Code Generation
----------------------

1. Click the menu (`Tools > Dart > Generate Code...`)
2. Select a base model (or package) that will be generated to Dart.
3. Select a folder where generated Dart source files (.dart) will be placed.

Belows are the rules to convert from UML model elements to Dart source codes.

### UMLPackage

* converted to a Dart _Package_ (as a folder with `__init__.dart`).

### UMLClass, UMLInterface

* converted to a Dart _Class_ definition as a separated module (`.dart`).
* Default constructor is generated (`def __init__(self):`)
* `documentation` property to docstring

### UMLEnumeration

* converted to a Dart class inherited from _Enum_ as a separated module (`.dart`).
* literals converted to class variables

### UMLAttribute, UMLAssociationEnd

* converted to an instance variable if `isStatic` property is true, or a class variable if `isStatic` property is false
* `name` property to identifier
* `documentation` property to docstring
* If `multiplicity` is one of `0..*`, `1..*`, `*`, then the variable will be initialized with `[]`.

### UMLOperation

* converted to an instance method if `isStatic` property is true, or a class method (`@classmethod`) if `isStatic` property is false
* `name` property to identifier
* `documentation` property to docstring
* _UMLParameter_ to method parameter

### UMLGeneralization, UMLInterfaceRealization

* converted to inheritance

