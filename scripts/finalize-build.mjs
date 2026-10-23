import { renameSync, copyFileSync } from 'node:fs'
renameSync('dist/index.source.html', 'dist/index.html')
copyFileSync('CNAME', 'dist/CNAME')
