const fs = require('fs');

async function run() {
    const lcnHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://usuarios.lcnidiomas.edu.co',
      'Referer': 'https://usuarios.lcnidiomas.edu.co/'
    };

    const boardUrl = `https://api.lcnidiomas.edu.co/api/schedules/between-dates/2/70/2026-06-18/2026-06-21?teachers=[]`;
    const boardRes = await fetch(boardUrl, { method: "GET", headers: lcnHeaders });
    const boardData = await boardRes.json();
    const classes = boardData.data || [];
    
    console.log(`Encontradas ${classes.length} clases.`);
    
    const targetIds = [539888, 541112, 541111, 541142, 541115, 541117, 541110];
    
    classes.forEach(c => {
        if (targetIds.includes(c.id)) {
            console.log(`\n=== CLASS ID: ${c.id} ===`);
            console.log(JSON.stringify(c, null, 2));
        }
    });
}

run();
