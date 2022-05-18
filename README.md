# Markdown As Configuration

Converts Markdown files to simple Json for intuitive human-readable configuration. Includes Macro-Style inclusions using Handlebars, so that you can build configuration based on other configuration, including configuration from linked files. [Apache 2.0 License](./LICENSE)

Install it into your project using:

```npm install --save md-as-config```

or you are super-brave and want to use the latest development version:

```npm install --save "https://github.com/storizzi/md-as-config.git#dev"```

## Example Usage

See the [Examples Folder](./examples/EXAMPLES.md)

Example node.js code to convert and display equivalent json:

``` javascript
const fs = require('fs');
const MDClass = require('md-as-config')

let md = new MDClass('./test.md')
let settings = md.settings

console.log(JSON.stringify(md,null,3))
```

## How the markdown is translated to Json - example

* Everything is wrapped in a 'settings' object - so you refer to anything as ```settings.<whatever>```
* Headings are representing by an object whose name (key) is the heading
  * These are (by default) converted to camel case removing punctuation 0 e.g. 'Personal Details' becomes 'personalDetails' - this is what you refer to if you use handlebars template replacement variables
* Sub-Headings are an object within the top-level object - nested however deep you like
* Any lists are treated as an array with the parent heading as the key
* If you have lists within lists, then the parent list item is treated like an object with the item as the key, and the items in the list as an array
* Lists are treated as an array unless there are child items that make it more like an object
* Lists can contain key-value pairs. These take the form ```* key:value```.
  * It is not recommended to mix values and key value pairs in lists - typically the key value pairs will be ignored
* Any description not in a heading or a list is treated like a description that belongs to the section related to the last heading (or sub-heading).
  * The description is placed in an attribute under the object under that heading called 'description'
  * Blank lines are ignored
  * If you put a description before / after settings the lines are added to previous description lines in one block of text
  * The section for a description ends when the next heading is encountered
* Handlebars is interpreted using the normal ```{{HandlebarsExpression}}``` notation. The results are typically used for values, rather than keys.

So for an input like this (reading from a file):

``` markdown
# Top Level Settings

This is description for top level settings

## Personal Details

This is general description above the personal settings

* Account Holder
  * First Name:Simon
  * Last Name:Huggins
  * Full Name:{{topLevelSettings.personalDetails.accountHolder.firstName}} {{topLevelSettings.personalDetails.accountHolder.lastName}}

This is general description below the personal settings



Notice how blank lines are ignored

## Other Details

Start of Other Details description

* RandomStuff
  * jki:abc
  * def
    * xyz
    * mess:thingsup-so-pretend-notthere
    * ghi
* Random something else
  * abc:123

@description-start
This is some description
at the bottom of the other details section

Notice that blank lines are included because they are inside the description-start block
@description-end
```

The json output looks like this:

``` json
{
   "settings": {
      "topLevelSettings": {
         "description": "This is description for top level settings\n",
         "personalDetails": {
            "description": "This is general description above the personal settings\nThis is general description below the personal settings\nNotice how blank lines are ignored\n",
            "accountHolder": {
               "firstName": "Simon",
               "lastName": "Huggins",
               "fullName": "Simon Huggins"
            }
         },
         "otherDetails": {
            "description": "Start of Other Details description\nThis is some description\nat the bottom of the other details section\n\nNotice that blank lines are included because they are inside the description-start block\n",
            "randomStuff": {
               "jki": "abc",
               "def": [
                  "xyz",
                  "ghi"
               ]
            },
            "randomSomethingElse": {
               "abc": "123"
            }
         }
      },
      "camelCase": true,
      "exePath": "./md-as-config",
      "settingsFilePath": "examples/",
      "settingsFileName": "examples/mytest.md",
      "settingsFileFound": true
   }
}
```

Note when you read from a file (whether initially or if including another settings file as part of the settings), the following settings are added:

* ```settingsFilePath``` - The location (directory / path) of the settings file
* ```settingsFileName``` - The filename and path of the settings file
* ```settingsFileFound``` - whether or not the settings file was found when attempting to include it
* ```exePath``` - path of executable - same as ```__dirname``` in node.js - useful as basis for file inclusions

The "camelCase" is defaulted to true if it isn't passed in the optional "initialSettings" parameter (not included in this example), which converts anything that looks like an object name / key to Camel Case to make it easier to reference in an object path.

But of course, you can refer to the returned objected directly as an object. E.g. to refer to the ```firstName``` attribute I could use:

```javascript
let md = new MDClass('./test.md')
console.log(`Welcome ${md.settings.topLevelSettings.personalDetails.accountHolder.firstName}!`)
```

Which in the example above would display ```Welcome Simon!```

## Use of Handlebars

[[Handlebars]](https://handlebarsjs.com/guide/) is used as a templating engine to allow template-style macro insertions into your settings, allowing for dynamic substitutions when the settings are read.

Whether this is a good idea or not is up for debate - it depends if you see settings as something that should be immutable until specifically changed, or if you see them as more as a part of your code base.

Additional Handlebars helpers have also been included for more specific configuration related use cases.

### includeSettings

Use this to include another markdown settings file within your settings file.

Parameters:

* File Name of settings file to include
* Optional: name of heading to include (otherwise all headings will be included from the settings file) - if you choose this option, then the heading itself will not be included, just the settings below it

### Example

``` markdown
# Included Details

* Base Dir:./
* User Details:«««includeSettings (append fileDetails.baseDir 'test2.md') 'personalDetails'»»»
```

Then in ```./test2.md```  we might have:

``` markdown
This is general description above the settings

* Account Holder
  * First Name:Simon
  * Last Name:Huggins
  * Full Name:{{accountHolder.firstName}} {{accountHolder.lastName}}

This is general description below the settings



Notice how blank lines are ignored
```

And the output would be:

``` json
{
   "settings": {
      "includedDetails": {
         "baseDir": "./",
         "personalDetails": {
            "description": "This is general description above the settings\nThis is general description below the settings\nNotice how blank lines are ignored\n",
            "accountHolder": {
               "firstName": "Simon",
               "lastName": "Huggins",
               "fullName": "Simon Huggins"
            },
            "settingsFilePath": "./",
            "settingsFileName": "./test2.md",
            "camelCase": true,
            "settingsFileFound": true
         },
      },
      "camelCase": true,
      "settingsFilePath": "./",
      "settingsFileName": "./test.md",
      "settingsFileFound": true
   }
}
```

### Nested Handlebars Parsing

One issue you can find is if you try to do substitutions too early - for example if one setting relies on another setting being parsed first because it depends on its contents

You can get around this by using substitute Handlebars markers which allows for parsing up three additional levels deep

* Level 0 - Normal level - use ```{{ expression }}```
* Level 1 - instead of ```{{ expression }}``` use ```⟦⟦ expression ⟧⟧```
* Level 2 - instead of ```{{ expression }}``` use ```«« expression »»```
* Level 3 - instead of ```{{ expression }}``` use ```⁅⁅ expression ⁆⁆```

This works for the triple raw markers as well - ```{{{ expression }}}``` (remember that Handlebars html-escapes using normal double markers - not always what you want, especially in a settings file)

### Include a file as description

You can always include a file as part of the description (rather than another settings file) using the includeTextFile helpers, with the filename to include as the parameter - e.g. on a line in the markdown file on its own, or as part of other description text:

```{{includeTextFile './test3.txt'}}```

---

END OF ```README.md``` file
