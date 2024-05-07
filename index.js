import { text, multiselect, spinner, isCancel, cancel, outro } from '@clack/prompts'
import { scrapeGoogleMaps } from './src/google-maps-scrape.js';
import { homedir } from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { Parser } from '@json2csv/plainjs'

const prompt = await text({
  message: 'What dou you want to search?',
  placeholder: 'Shopping Malls',
  initialValue: 'Marine supply store'
})

if (isCancel(prompt)) {
  process.exit(0)
}

const outputType = await multiselect({
  message: 'Pick a output from data.',
  options: [
    { value: 'console', label: 'Print in console' },
    { value: 'json', label: 'Json File' },
    { value: 'csv', label: 'CSV File' }
  ]
})


if (isCancel(outputType)) {
  process.exit(0)
}

let pathPrompt = ''
let fileName = ''
if (outputType.some(type => type === 'json' || type === 'csv')) {
  pathPrompt = await text({
    message: `Enter the path to save the ${outputType} file`,
    placeholder: homedir(),
    initialValue: homedir()
  })
  
  if (isCancel(pathPrompt)) {
    process.exit(0)
  }

  fileName = await text({
    message: `Enter the name of the file`,
    placeholder: 'google_data',
    initialValue: 'file' 
  })

  if (isCancel(fileName)) {
    process.exit(0)
  }
}

const s = spinner()
s.start('Sraping Google Maps...')
const results = await scrapeGoogleMaps(prompt)
s.stop('Enf of scraping Google Maps!')

if (outputType.includes('console')) {
  console.log(results)
}

if (outputType.includes('json')) {
  const filePath =  path.format({
    root: '/',
    dir: homedir(),
    base:  `${fileName}.json`,
  })
  const jsonString = JSON.stringify(results, null, 2)
  fs.writeFileSync(filePath, jsonString, { encoding: 'utf-8' })
}

if (outputType.includes('csv')) {
  const filePath =  path.format({
    root: '/',
    dir: homedir(),
    base:  `${fileName}.csv`,
  })

  try {
    const parser = new Parser()
    const csv = parser.parse(results)

    fs.writeFileSync(filePath, csv, { encoding: 'utf-8' })
  } catch (err) {
    cancel('Error saving file')
  }
}


outro(`Finished scraping Google Maps for ${prompt}!`)
