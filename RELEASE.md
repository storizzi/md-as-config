# RELEASE HISTORY

## v1.0.1 - 18 May 2022

- Fixed issue where a subheading of the next order was not permitted - e.g. # followed by ### without a ## heading appearing first
- Fixed issue where sometimes a 'description' row would appear in its own object
- Fixed issue where sometimes settingsValue array appearing in an object on its own would not be simplified to an array without the settingsValue prefix or object (eg. x : { settingsValues: [a,b,c]} would now get reduced to x: [a,b,c])

## v1.0.0 - 30 Jan 2022

- Initial release with README.md
- Added an example test script to show how this works - also a useful test bed to try stuff out generally
- Added exePath as an executable path representation of ```_dirname``` to make it easier to run test scripts consistently
