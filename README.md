# Markdown As Configuration

Converts Markdown files to simple Json for intuitive human-readable configuration. Includes Macro-Style inclusions using Handlebars, so that you can build configuration based on other configuration, including configuration from linked files. [Apache 2.0 License](./LICENSE)

## Examples

See the [Examples Folder](./examples/EXAMPLES.md)

## How the markdown is translated to Json - example

* Everything is wrapped in a 'settings' object - so you refer to anything as ```settings.<whatever>```
* Headings are representing by an object whose name (key) is the heading
  * These are (by default) converted to camel case removing punctuation 0 e.g. 'Personal Details' becomes 'personalDetails' - this is what you refer to if you use handlebars template replacement variables
* Sub-Headings are an object within the top-level object - nested however deep you like
* Any lists are treated as an array with the parent heading as the key
* If you have lists within lists, then the parent list item is treated like an object with the item as the key, and the items in the list as an array
* Any description not in a heading or a list is treated like a description that belongs to the section related to the last heading (or sub-heading).
  * The description is placed in an attribute under the object under that heading called 'description'
  * Blank lines are ignored
  * If you put a description before / after settings the lines are added to previous description lines in one block of text
  * The section for a description ends when the next heading is encountered
* 

So for an input like this:

``` markdown
# Top Level Settings

This is description for top level settings

## Personal Details

This is general description above the personal settings

* Account Holder
  * First Name:Simon
  * Last Name:Huggins
  * Full Name:{{accountHolder.firstName}} {{accountHolder.lastName}}

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
               "fullName": " "
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
      "settingsFilePath": "examples/",
      "settingsFileName": "examples/mytest.md",
      "settingsFileFound": true
   }
}
```

## Use of Handlebars

[[Handlebars]](https://handlebarsjs.com/guide/) is used as a templating engine to allow template-style macro insertions into your settings, allowing for dynamic substitutions when the settings are read.

Whether this is a good idea or not is up for debate - it depends if you see settings as something that should be immutable until specifically changed, or if you see them as more as a part of your code base.

Additional Handlebars helpers have also been included for more specific configuration related use cases.

## includeSettings

Use this to include another markdown settings file within your settings file.

Parameters:

* File Name of settings file to include
* Optional: name of heading to include (otherwise all headings will be included from the settings file) - if you choose this option, then the heading itself will not be included, just the settings below it

###Example

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
         "userDetails": {
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

* Level 1 - instead of ``{{ expression }}`` use ``⟦⟦ expression ⟧⟧``
* Level 2 - instead of ``{{ expression }}`` use ``«« expression »»`
* Level 3 - instead of ``{{ expression }}`` use ``⁅⁅ expression ⁆⁆`

This works for the triple raw markers as well - ```{{{ expression }}}``` (remember that Handlebars html-escapes using normal double markers - not always what you want, especially in a settings file)

