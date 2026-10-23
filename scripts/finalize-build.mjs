import { renameSync, copyFileSync, cpSync, readdirSync, writeFileSync } from 'node:fs'
renameSync('dist/index.source.html', 'dist/index.html')
copyFileSync('CNAME', 'dist/CNAME')
for (const entry of readdirSync('dist')) cpSync('dist/'+entry, entry, { recursive: true })
writeFileSync('.nojekyll', '')
