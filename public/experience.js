/* Defer optional enhancements until the original interface can render. */
(()=>{const base=new URL('.',document.currentScript.src);for(const file of ['model.js','analytics.js'])import(new URL(file+'?v=relay3',base).href).catch(()=>console.warn('RELYNX optional enhancement could not load: '+file));})();
