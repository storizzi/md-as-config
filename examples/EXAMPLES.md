# MD-AS-CONFIG Examples

This folder contains examples of how to use MD-AS-CONFIG

## Test

The [test.js](./test.js) example shows how to load an example test settings file [test.md](./test.md) and displays the json conversion of this file when executed.

You can execute it one of two ways:

* cd into the examples directory and enter ```node test``` from this directory
* From the root directory, enter ```npm test``` - saves a cd! No I know it's not a proper test
* Run against a test filenof your own - eg ```node test mytest.md```

This in turn inserts sections from the [test2.md](./test2.md) settings file embedded in settings within the main settings, demonstrating how it is possible to have multiple sections within a settings file and extract settings from just those sections.

The result of running [test.js](./test.js) is as follows:

```
➜  examples git:(main) ✗ node test
```
``` json
{
   "settings": {
      "testSettings": {
         "description": "This is the description\nthat will be included and will replace the preamble\n",
         "setting1": "true",
         "greetingMessage": "Hello Simon"
      },
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
         "otherDetails": {
            "randomStuff": {
               "jki": "abc",
               "def": [
                  "xyz",
                  "ghi"
               ]
            },
            "randomSomethingElse": {
               "abc": "123"
            },
            "description": "This is some description\nat the bottom of the file\n\nNotice that blank lines are included because they are inside the description-start block\n",
            "settingsFilePath": "./",
            "settingsFileName": "./test2.md",
            "camelCase": true,
            "settingsFileFound": true
         },
         "allDetails": {
            "personalDetails": {
               "description": "This is general description above the settings\nThis is general description below the settings\nNotice how blank lines are ignored\n",
               "accountHolder": {
                  "firstName": "Simon",
                  "lastName": "Huggins",
                  "fullName": " "
               }
            },
            "otherDetails": {
               "randomStuff": {
                  "jki": "abc",
                  "def": [
                     "xyz",
                     "ghi"
                  ]
               },
               "randomSomethingElse": {
                  "abc": "123"
               },
               "description": "This is some description\nat the bottom of the file\n\nNotice that blank lines are included because they are inside the description-start block\n"
            },
            "settingsFilePath": "./",
            "settingsFileName": "./test2.md",
            "camelCase": true,
            "settingsFileFound": true
         }
      },
      "camelCase": true,
      "settingsFilePath": "./",
      "settingsFileName": "./test.md",
      "settingsFileFound": true
   }
}
```