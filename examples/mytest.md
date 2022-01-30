# Top Level Settings

This is description for top level settings

## Personal Details

This is general description above the personal settings

* Account Holder
  * First Name:Simon
  * Last Name:Huggins
  * Full Name:{{topLevelSettings.personalDetails.accountHolder.firstName}} {{topLevelSettings.personalDetails.accountHolder.lastName}}

This is general description below the personal settings

{{includeTextFile './test3.txt'}}


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
