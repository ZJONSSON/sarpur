Downloads all media files from [ruv.is](http://ruv.is/sarpurinn) for a given date (or yesterday if date is not specified).   This repo is an example of how a nested scrape can be constructed with simple [etl](https://www.npmjs.com/package/etl) pipeline.

Setup:
run `npm install` from root directory

Usage:
`node index [date]`

Date is optional.  You can supply verbal dates, i.e. `today`, `yesterday`, `"last saturday"` or an explicit date (YYYY-MM-DD).  Media files will be saved by date in the `./files` directory.