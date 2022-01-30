# Test Settings

This is some description that will be ignored

* setting 1:true
* Greeting Message:Hello {{{includedDetails.userDetails.accountHolder.firstName}}}

@description-start-replace
This is the description
that will be included and will replace the preamble
@description-end

# Included Details

* Base Dir:./
* User Details:«««includeSettings (append includedDetails.baseDir 'test2.md') 'personalDetails'»»»
* Other Details:«««includeSettings (append includedDetails.baseDir 'test2.md') 'otherDetails'»»»
* All Details:«««includeSettings (append includedDetails.baseDir 'test2.md')»»»
