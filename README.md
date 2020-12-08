# SmartSearchFilter

(*Anticipated **npm** library name: "**smart-search-filter**"*)

Standalone ES6 search/filter using simple Google-style search strings to perform complex filter operations.

Features:

* Filter arrays using simple yet powerful search strings.   (ie: filtering JSON API results)
* Match fields containing individual words or exact phrases.
* AND/OR/NOT search combinations. 
* Wildcard patterns allowed. (glob style "*" & "?")
* Search across multiple default fields/properties or specify exact field(s) to match.  
* Case insensitive. 

## Example:

```javascript
import {smartSearchFilter} from SmartSearchFilter

let pets = [                                    // the array to filter
<pre>
  { id:0, name:'Jemma',  type:'Cat',     breed:'Tabby',           owner:'Joe Blogs' },
  { id:1, name:'Jimmy',  type:'Dog',     breed:'German Shepherd', owner:'Sara Hartman' },
  { id:2, name:'Jazzy',  type:'Chicken', breed:'Isa Brown',       owner:'Oscar Black' },
  { id:3, name:'Fitch',  type:'Dog',     breed:'German Coolie',   owner:'Mildred Gutierrez' },
  { id:4, name:'Butch',  type:'Dog',     breed:'Poodle',          owner:'Gabija Jim' },
  { id:5, name:'Bagel',  type:'Cat',     breed:'German Rex',      owner:'Abdullah Floyd' },
</pre>
];

let search = 'dog german';                      // the search phrase
let defaultFields = 'name|type|breed|owner';    // CSV format also accepted - ie: 'name,type,breed,owner'

let results = smartSearchFilter(pets, search, defaultFields);

results.forEach(pet => console.log(pet))
```

Will display:
<pre>
  { id:1, name:'Jaz',    type:'<b>Dog</b>',     breed:'<b>German</b> Shepherd', owner:'Sara Hartman' },
  { id:3, name:'Fitch',  type:'<b>Dog</b>',     breed:'<b>German</b> Coolie',   owner:'Mildred Gutierrez' },
</pre>

## More Example Search Filters:

### Example 1: `'dog german'` 
* Simple "AND" search containing **both words**.
* Each word can be found in any of the default search fields.
<pre>
  { id:1, name:'Jaz',    type:'<b>Dog</b>',     breed:'<b>German</b> Shepherd', owner:'Sara Hartman' },
  { id:3, name:'Fitch',  type:'<b>Dog</b>',     breed:'<b>German</b> Coolie',   owner:'Mildred Gutierrez' },
</pre>

### Example 2: `'dog german | "joe blogs" cat'` 
* **AND/OR** search combination.
* **"Exact phrase"** (vs single word) specified in double quotes.
<pre>
  { id:0, name:'Jemma',  type:'<b>Cat</b>',     breed:'Tabby',           owner:'<b>Joe Blogs</b>' },
  { id:1, name:'Jaz',    type:'<b>Dog</b>',     breed:'<b>German</b> Shepherd', owner:'Sara Hartman' },
  { id:3, name:'Fitch',  type:'<b>Dog</b>',     breed:'<b>German</b> Coolie',   owner:'Mildred Gutierrez' },
</pre>

### Example 3: `'dog -german'`
* **Exclude** results containing a specific search term by preceeding it with a **"-"**.  
* (Can also exclude "exact phrases" by inserting **"-"** before the quotation marks.)
<pre>
  { id:4, name:'Butch',  type:'<b>Dog</b>',     breed:'Poodle',          owner:'Gabija Jim' },
BUT NOT:
  <s>{ id:1, name:'Jaz',    type:'<b>Dog</b>',     breed:'<font color="red"><b>German</b></font> Shepherd', owner:'Sara Hartman' },</s>
  <s>{ id:3, name:'Fitch',  type:'<b>Dog</b>',     breed:'<font color="red"><b>German</b></font> Coolie',   owner:'Mildred Gutierrez' },</s>
</pre>

### Example 4: `'j???y | o*bl`
* **Wildcard** searches (glob-style)
* Wildcards can be combined with other operations such as this "OR" search combination shown here.
* (Wildcards can also be used in "exact phrases" - ie: `'"one two * nine ten"'`)
<pre>
  { id:0, name:'Jemma',  type:'Cat',     breed:'Tabby',           owner:'J<b>oe Bl</b>ogs' },
  { id:1, name:'<b>Jimmy</b>',  type:'Dog',     breed:'German Shepherd', owner:'Sara Hartman' },
  { id:2, name:'<b>Jazzy</b>',  type:'Chicken', breed:'Isa Brown',       owner:'<b>Oscar Bl</b>ack' },
</pre>

### Example 5: `'jim*'`
* Special search with "wildcard at end of word/phrase" requires the field to **start with** (vs **contain**) the specified search string.
* All other searches match fields **containing** the search term (which is like searching for the wildcard pattern `'*jim*'`).  (This special syntax effectively removes the leading wildcard.)
<pre>
  { id:1, name:'<b>Jimmy</b>',  type:'Dog',     breed:'German Shepherd', owner:'Sara Hartman' },
BUT NOT:
  <s>{ id:4, name:'Butch',  type:'Dog',     breed:'Poodle',          owner:'Gabija <font color="red"><b>Jim</b></font>' },</s>
</pre>

### Example 6: `'type|owner:og -name:ch'`
* Searches terms are normally matched in all **default search fields**, and these examples have assumed searching the `name|type|breed|owner` default search fields.
* However **specific field(s)** can be specified as in this example.
* This example matches "og" but only in the `type` or `owner` field.  It excludes entries containing "ch", but only if found in the `name` field.
<pre>
  { id:0, name:'Jemma',  type:'Cat',     breed:'Tabby',           owner:'Joe Bl<b>og</b>s' },
  { id:1, name:'Jimmy',  type:'D<b>og</b>',     breed:'German Shepherd', owner:'Sara Hartman' },
BUT NOT
  <s>{ id:3, name:'Fit<font color="red"><b>ch</b></font>',  type:'D<b>og</b>',     breed:'German Coolie',   owner:'Mildred Gutierrez' },</s>
  <s>{ id:4, name:'But<font color="red"><b>ch</b></font>',  type:'D<b>og</b>',     breed:'Poodle',          owner:'Gabija Jim' },</s>
</pre>

## Search Phrase Specification:

TBA

## Future Development:

* The original intention was to create an NPM library, however I got scared by the complexity as well as the wide variety of javascript library formats... so I decided to simply release the JS file in the hope it will be of benefit to others.  Pull requests and forks are welcome.

* The code has intentionally been segregated into a two-step process to firstly interpret then apply the required filter operations.  This was intended to lend itself very well to allowing creation of database queries (ie: mysql "where clause") to allow consistent filtering of a database back-end.  (BUT need to think carefuly through SQL-injection issues - maybe better to pass the filter-ops to the back-end which then creates the SQL either directly or using a safer alternative like Laravel's Query Builder interface).

* Insert an animation at top of README file to give people a quick visual - ie: like npm:fuzzy library.

