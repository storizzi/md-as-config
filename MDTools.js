const fs = require('fs')
var merge = require('deepmerge')
var path = require('path')
var Handlebars = require('handlebars')
var helpers = require('handlebars-helpers')()
Handlebars.registerHelper('date', require('helper-date'))
var camelCase = require('lodash.camelcase')

MDTools = function(settingsFileName,rootSettingsKey,initialSettings,createRootSettingsKey) {
    this.settings=initialSettings?initialSettings:{camelCase:true, exePath:__dirname}
    if (settingsFileName) {
        this.settings = MDTools.settingsFromFile(settingsFileName,this.settings,null,rootSettingsKey,createRootSettingsKey)
    }
}

MDTools.prototype.getSettingsFile = function(fileName, rootSettingsKey, additionalSettings,
        createRootSettingsKey,beforeHandleBarsHook,ignoreHandlebars) {
    if (additionalSettings) {
        if (!this.settings) this.settings = {camelCase: true, exePath:__dirname}
        this.settings = merge(this.settings, additionalSettings, { arrayMerge: MDTools.combineMerge } )
    }
    this.settings = MDTools.settingsFromFile(fileName,this.settings,null,rootSettingsKey,
        createRootSettingsKey,beforeHandleBarsHook,ignoreHandlebars)
    //console.log(fileName)
    //console.log(this.settings)
    return this.settings
}

Handlebars.registerHelper('toNumber', function(str) {
    return Number(str);
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context,null,1);
});

Handlebars.registerHelper('includeSettings', function(context, rootSettingsKey, debug, options) {
    console.log(context)
    if (rootSettingsKey?.data) {
        rootSettingsKey=null
        options = rootSettingsKey
    }
    if (debug?.data) {
        debug = null
        options = debug
    }
    let fileResults = MDTools.settingsFromFile(context,null,debug,rootSettingsKey,null,null,false)
    //console.log(options)
    //console.log(rootSettingsKey)
    return JSON.stringify(fileResults);
});

Handlebars.registerHelper('includeTextFile', function(context) {
    // console.log(context)
    if (fs.existsSync(context)) {
        let readText=fs.readFileSync(context,"utf-8").replaceAll("\n","\\n").replaceAll("\"","\\\"")
        //console.log(readText)
        return readText
    } else {
        return ""
    }
});

MDTools.combineMerge = (target, source, options) => {
    const destination = target.slice()
 
    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
        } else if (options.isMergeableObject(item)) {
            destination[index] = merge(target[index], item, options)
        } else if (target.indexOf(item) === -1) {
            destination.push(item)
        }
    })
    return destination
}

MDTools.increaseHeadingLevels = function(strText,incLevelBy) {
    const headingRegex = "^(#+)\\s"
    let results = ""
    let lines = strText.split("\n")
    for (let line of lines) {
        lineMatch = line.match(headingRegex)
        if (lineMatch) {
            line = line.replace(lineMatch[1],lineMatch[1]+"#".repeat(incLevelBy))
        }
        results += line + "\n"
    }
    return results
}

MDTools.findSectionByHeading = function(strText,heading, level, headingMatch) {

    const nextHeadingRegex = "^#{1," + level + "}\\s"
    const subHeadingRegex = "^" + "#".repeat(level+1) + "\\s"
    const searchFor = "#".repeat(level)+" "+heading.toUpperCase()
    
    let headingLocated = false
    let subheadingLocated = !headingMatch
    let results = ""
    let lines = strText.split("\n")

    for (line of lines) {
        if (headingLocated) {
            if ( line.match(nextHeadingRegex) ) {
                headingLocated = false
                subheadingLocated = false
            } else if (line.match(subHeadingRegex)) {
                subheadingLocated = line.match(headingMatch) != null ? true : false
                // console.log(subHeadingRegex+" - "+line+" - "+subheadingLocated)
            }
        }
        if (line.toUpperCase() === searchFor) {
            headingLocated = true
        }
        if (headingLocated && subheadingLocated) {
            results += line + "\n"
        }
    }
    return results
}

MDTools.settingsFromFile = function(filename, settingsToMerge, includeStructuralSettingsAndSource,
        rootSettingsKey, createRootSettingsKey, beforeHandleBarsHook, ignoreHandlebars) {
    let settings = {
        settingsFilePath:path.dirname(filename)+"/",
        settingsFileName:filename,
        camelCase: true
    }
    if (settingsToMerge) settings = merge(settingsToMerge,settings, { arrayMerge: MDTools.combineMerge } )
    if(fs.existsSync(filename)) {
        settings.settingsFileFound = true
        return MDTools.extractSettings(fs.readFileSync(filename,"utf-8"),
            settings,
            includeStructuralSettingsAndSource,
            rootSettingsKey,
            createRootSettingsKey,
            beforeHandleBarsHook,
            ignoreHandlebars)
    } else {
        settings.settingsFileFound = false
        return settings
    }
    
}

MDTools.recurseExtract = function (obj,settings) {

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj

    let result = {}

    let strippedObj = obj
    delete strippedObj.settingTitle
    delete strippedObj.parentSettingTitle
    // console.log(`Stripped Obj: ${util.inspect(strippedObj,false,3)}`)

    let entries = Object.entries(strippedObj)
    let strippedObjLength = entries.length

    for (let [key, value] of entries) {
        if (settings && settings.camelCase) key = camelCase(key)

        if (key === "settingValues" && Array.isArray(value)) {
            let settingArray = []
            for (const item of value) {
                let parsedArrItem = MDTools.recurseExtract(item,settings)
                // console.log(`Parsed Arr Item: ${util.inspect(parsedArrItem,false,2)}`)
                if (typeof parsedArrItem === 'object' && parsedArrItem !== null) {
                    let parsedArrItemEntries = Object.entries(parsedArrItem)
                    if(parsedArrItemEntries.length===1) {
                        let toItem = parsedArrItemEntries[0][0]
                        if (settings && settings.camelCase) toItem = camelCase(toItem)
                        let fromItem = parsedArrItemEntries[0][1]
                        result[toItem]=fromItem
                    } else {
                        settingArray.push(parsedArrItem)
                    }
                } else {
                    if (parsedArrItem) settingArray.push(parsedArrItem)
                }
            }
            
            if (settingArray.length===1 &&
                typeof settingArray[0] === 'object' &&
                settingArray[0] !== null)
            {
                let settingArrayEntries = Object.entries(settingArray[0])
                if (settingArrayEntries.length===1) {
                    let toItem = settingArrayEntries[0][0]
                    if (settings && settings.camelCase) toItem = camelCase(toItem)
                    let fromItem = settingArrayEntries[0][1]
                    result[toItem]=fromItem
                }
            } else {
                if (settingArray.length>0) result["settingValues"] = settingArray
            }
        } else {
            //console.log(key+" >> "+value)
            // console.log(util.inspect(strippedObj,false,3))
            // if (settings && settings.camelCase) key = camelCase(key)
            value = MDTools.recurseExtract(value,settings)
            if (strippedObjLength===1 && key === "description") {
                result = value
                // console.log('Single: '+key+" >> "+value)
            } else result[key]=value
        }
        if (key === "settingValues" && strippedObjLength===1) {
            result = value
        }
    }
    let resultEntries = Object.entries(result)

    let settingValue = result.settingValue
    if (settingValue) {
        if (resultEntries.length === 1 ) return settingValue
        if (result.settingValues) {
            result = result.settingValues
        } else {
            delete result.settingValue
        }
         //console.log("settingValue:"+JSON.stringify({settingValue:result},null,3))
        let settingRet = {}
        if (settings && settings.camelCase) settingValue = camelCase(settingValue)
        settingRet[settingValue]=result
        return settingRet
    }

    return result
}

MDTools.extractSettings = function(strText, settingsToMerge, includeStructuralSettingsAndSource, rootSettingsKey,
        createRootSettingsKey, beforeHandleBarsHook, ignoreHandlebars) {

    let structuralSettings = MDTools.extractStructuralSettings(strText)
    // console.log(JSON.stringify(structuralSettings,null,3))
    delete structuralSettings.terminatingHeading

    if (!settingsToMerge) settingsToMerge = {camelCase:true}

    let result = MDTools.recurseExtract(structuralSettings,settingsToMerge)
    // console.log(JSON.stringify(result,null,3))
    if (rootSettingsKey) {
        if(createRootSettingsKey) {
            if (typeof createRootSettingsKey === "string") {
                result[createRootSettingsKey] = result[rootSettingsKey]
                delete result[rootSettingsKey]
            } else {
                let newResult = {}
                newResult[rootSettingsKey] = result
                result = newResult
            }
        } else {
            result = result[rootSettingsKey]
        }
    }
    if (settingsToMerge) result = merge(result,settingsToMerge, { arrayMerge: MDTools.combineMerge } )

    if (!ignoreHandlebars) {
        if(beforeHandleBarsHook) {
            beforeHandleBarsHook(result,rootSettingsKey,createRootSettingsKey)
        }

        let settingsStr = JSON.stringify(result,null,3)
            .replaceAll("{{{","⁅⁅⁅")
            .replaceAll("}}}","⁆⁆⁆")
            .replaceAll("{{","⁅⁅")
            .replaceAll("}}","⁆⁆")

        // Allow use of settings template markers
        let replaceMarkers = [["⟦","⟧"],["«","»"],["⁅","⁆"]]

        for (let replMarkerIdx=0; replMarkerIdx<=2; replMarkerIdx++) {

            let leftReplaceMarker = replaceMarkers[replMarkerIdx][0]
            let rightReplaceMarker = replaceMarkers[replMarkerIdx][1]

            settingsStr = settingsStr
                .replaceAll(new RegExp(leftReplaceMarker.repeat(3),"g"),"{{{")
                .replaceAll(new RegExp(rightReplaceMarker.repeat(3),"g"),"}}}")
                .replaceAll(new RegExp(leftReplaceMarker.repeat(2),"g"),"{{")
                .replaceAll(new RegExp(rightReplaceMarker.repeat(2),"g"),"}}")
            //console.log(leftReplaceMarker + rightReplaceMarker + "\n" + settingsStr)
            result=JSON.parse(settingsStr)
            let dereferenceMatch
            do {
                dereferenceMatch = settingsStr.match('\\"(\\{{3}(json|includeSettings) .*?\\}{3})\\"')
                if (dereferenceMatch) {
                    settingsStr = settingsStr.replace(dereferenceMatch[0],dereferenceMatch[1])
                }
            } while (dereferenceMatch)
            //console.log(settingsStr)

            let inStr
            do {
                inStr = settingsStr
                //console.log(settingsStr)
                let template = Handlebars.compile(settingsStr)
                settingsStr = template(result)
                //console.log(settingsStr)
                result=JSON.parse(settingsStr)
            } while (inStr != settingsStr)
        }

    }

    if (includeStructuralSettingsAndSource) {
        return {settings:result,structuralSettings:structuralSettings, source:strText}
    }

    return result;
}

MDTools.extractStructuralSettings = function(strText) {

    const headingRegex = "^(#+)\\s*(.*)$"
    const valueRegex = "^(\\s*)[*-]\\s*(.*?)$"
    const settingRegex = "^\\s*[*-]\\s*(.*?):\\s*(.*)$"

    let results = ""
    // console.log(util.inspect(strText,1))
    let lines = strText.split("\n"); lines.push("# terminatingHeading")
    let headingAncestors = [{settingTitle:"rootSettings"}]
    let indentAncestors = [{}]

    for (line of lines) {

        // if inside description literal section then just add the line and carry on whatever is inside it
        if (headingAncestors.length>0) {
            let parent = headingAncestors[headingAncestors.length-1]
            if (parent.descriptionStart) {
                if(line.match("@description-end")) {
                    delete parent.descriptionStart
                } else {
                    parent.description += line + "\n"
                }
                continue
            }
        }

        let headingMatch = line.match(headingRegex)
        if (headingMatch !== null) {
            let headingLevel = headingMatch[1].length
            let headingTitle = headingMatch[2]
            // console.log(`${headingTitle} Level ${headingLevel}`)

            while (headingAncestors.length > headingLevel) headingAncestors.pop()
            let newHeading = {settingTitle:headingTitle}
            headingAncestors[headingLevel-1][headingTitle] = newHeading
            headingAncestors.push(newHeading)
            indentAncestors = [newHeading];
        } else {
            indentMatch = line.match(valueRegex)
            if (indentMatch !== null) {
                let indentLevel = (indentMatch[1].length / 2) + 1

                while (indentAncestors.length > indentLevel) indentAncestors.pop()
                let parent = indentAncestors[indentAncestors.length-1]

                let settingTitle = null
                let settingValue = null

                let pairMatch = line.match(settingRegex)

                if (pairMatch != null) {
                    settingTitle = pairMatch[1]
                    settingValue = pairMatch[2]
                    let newHeading = {
                        settingTitle:settingTitle,
                        settingValue:settingValue
                    }
                    if (parent.settingTitle) newHeading.parentSettingTitle=parent.settingTitle
                    indentAncestors[indentLevel-1][settingTitle] = newHeading
                    indentAncestors.push(newHeading)
                    // console.log(indentAncestors)
                } else {
                    if(!parent.settingValues) parent.settingValues = [];
                    let settingValue = {
                        settingValue:indentMatch[2]
                    }
                    if (parent.settingTitle) settingValue.parentSettingTitle=parent.settingTitle
                    parent.settingValues.push(settingValue)
                    indentAncestors.push(settingValue)
                }
                // console.log(`${" ".repeat(indentLevel*2)} * [${settingValue}]`)

            } else {
                if (line.length>0) {
                    let parent = headingAncestors[headingAncestors.length-1]
                    if (!parent.description) parent.description=""
                    if(line.match("@description-start")) {
                        parent.descriptionStart = true
                        if(line.match("@description-start-replace")) parent.description=""
                    } else {
                        parent.description += line + "\n"
                    }
                }
            }
        }
    }
    // console.log(JSON.stringify(headingAncestors[0],null,3))

    return headingAncestors[0]
}

module.exports = MDTools