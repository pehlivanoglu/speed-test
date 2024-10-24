async function download_file_and_measure_time(size: number) {
    // TODO: add size check logic 
    let start = Date.now();
    
    await fetch(`http://10.200.90.33:3000/download${size}`, {
        method: 'GET',
    }).then((response) => {
        let end = Date.now();
        console.log(`${size}MB : `, end - start, 'ms');
        console.log(`${(size*8) / ((end - start) / 1000)} Mb/s`);
    })
    .catch((error) => {
        console.error('Error fetching the file:', error);
    });
}

download_file_and_measure_time(1);