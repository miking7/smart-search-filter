// /* eslint-disable no-unused-vars */


// simplified functional entry point when only filtering is required
export function smartSearchFilter(content, searchString, defaultFields = "", options = {}) {
  const filt = new SmartSearchFilter(searchString, defaultFields, options)
  return filt.filter(content)
}

// main entry point (class)
export class SmartSearchFilter {
  
  constructor(searchString, defaultFields = "", options = {}) {
    // split defaultFields to an array if required
    if (!(defaultFields instanceof Array))
      defaultFields = defaultFields.replace(',', '|').split('|')    // split fields by '|' or ','
    this.defaultFields = defaultFields
    // process options
    const defaultOptions = { caseSensitive: false }
    this.options = {...defaultOptions, ...options}
    // compile the searchString
    this.parse(searchString)
  }

  parse(searchString) {
    this.searchString = searchString || ''
    this.filterOpsArray = []
    this.errors = ""

    // split search string into phrases - taking quotation marks into account - ref: https://stackoverflow.com/questions/2817646/javascript-split-string-on-space-or-on-quotes-to-array
    const search_phrases = this.searchString.match(/-{0,1}([a-z0-9|,_]+:){0,1}"[^"]+"|[^ ]+|\|/ig)    || []   // return empty array if undefined
    
    // split phrases into "AND" groups (between "|" / "OR" operators)
    // ie: searchString: 'cristian week | rolf taree'  -->  means: OR( AND(cristian,week), AND(rolf,taree) )  -->  and_groups_phrases = [ ['cristian','week'], ['rolf','taree'] ]
    let and_groups_phrases = [[]]
    search_phrases.forEach(phrase => {
      if (phrase == "|") 
        and_groups_phrases[and_groups_phrases.length] = []
      else
        and_groups_phrases[and_groups_phrases.length-1] = [...and_groups_phrases[and_groups_phrases.length-1], phrase ]
    })

    // decode phrase arrays into filter operations arrays
    const and_groups_filter_ops = and_groups_phrases.map(and_phrases => {
      const and_array = and_phrases.map(phrase => {
        let invert = false
        if (phrase.startsWith('-')) {
          invert = true
          phrase = phrase.slice(1)  // remove leading '-'
        }
        let searchFields = this.defaultFields   // default
        const match = phrase.match(/([a-z0-9|,_]+):/i)
        if (match) {
          searchFields = match[1]
          phrase = phrase.slice(searchFields.length+1)
          if (!(searchFields instanceof Array))
            searchFields = searchFields.replace(',', '|').split('|')    // split fields by '|' or ','
        }
        phrase = phrase.replace(/"/g,"")    // remove quotation marks
        phrase = phrase.replace(/\|/g,"")    // remove "|" occurances (usually only if errors in syntax)
        let main_filter_ops = ["MATCH", searchFields, phrase]
        if (invert)
          main_filter_ops = ["NOT", main_filter_ops]    // invert if required
        return main_filter_ops
      })
      return ["AND", ...and_array]
    })
    this.filterOpsArray = ["OR", ...and_groups_filter_ops]
  }

  filter(items) {
    const so = this
    return items.filter(item => so.test(item, so.filterOpsArray))
  }

  test(x, filter_operations_array=this.filterOpsArray){
    const [fn, ...params] = filter_operations_array
    const so = this
    const fns = {
      'AND': function (params) {
        return params.every(param => so.test(x, param))
      },
      'OR': function (params) {
        return params.some(param => so.test(x, param))
      },
      'NOT': function (params) {
        const [param] = params
        return !so.test(x, param)
      },
      'MATCH': function (params) {
        const [fields, glob] = params
        let reString = glob.replace(/[-\\^$+.()|[\]{}]/g, '\\$&') // escape all regex special characters - except for '*' and '?'.  Ref: https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711
        if (reString.endsWith('*'))
          reString = '^' + reString                               // special search with "wildcard at end of word/phrase" requires the field to **start with** (vs **contain**) the specified search string.
        reString = reString.replace(/\*/g, '.*')                  // convert glob '*' to regex ".*"
        reString = reString.replace(/\?/g, '.')                   // convert glob '?' to regex "."
        const re = new RegExp(reString, 'i')
        return fields.some(field => {                             // MATCH returns true if 'some' (ie: any) fields match the specified glob(/regex) pattern
          return re.test(x[field])
        })
      },
      'default': function () {
        console.log("INVALID CODE")
      }
    }
    return (fns[fn] || fns['default'])(params)  // call the appropriate mapped function
  }

  get filterOpsDescription() {
    // return string-version of filterOpsArray
    function describeFilterOpsRecursive(filter_operations_array) {
      function indent(text) {
        return text.split('\n')
          .map(line => '  ' + line)
          .join('\n')
      }
      const [fn, ...params] = filter_operations_array
      const fns = {
        'AND': function (params) {
          const paramsDescriptions = params.map(param => describeFilterOpsRecursive(param))
          return 'AND(\n' + indent(paramsDescriptions.join(',\n')) + " )"
        },
        'OR': function (params) {
          const paramsDescriptions = params.map(param => describeFilterOpsRecursive(param))
          return 'OR(\n' + indent(paramsDescriptions.join(',\n')) + " )"
        },
        'NOT': function (params) {
          const [param] = params
          return `NOT( ${describeFilterOpsRecursive(param)} )`
        },
        'MATCH': function (params) {
          const [fields, glob] = params
          return `MATCH("${fields.join('|')}", "${glob}")`
        },
        'default': function () {
          console.log("INVALID CODE")
        }
      }
      return (fns[fn] || fns['default'])(params)  // call the appropriate mapped function
    }

    return describeFilterOpsRecursive(this.filterOpsArray)
  }
  
}




