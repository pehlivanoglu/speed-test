async function fetchAndProcessFile() {
    try {
        let start = Date.now();
        let response = await fetch('http://localhost:3000/download1', {
            method: 'GET',
        });
        let end = Date.now();
        console.log('1MB :', end - start, 'ms');

        start = Date.now();
        response = await fetch('http://localhost:3000/download10', {
            method: 'GET',
        });
        end = Date.now();
        console.log('10MB :', end - start, 'ms');

        start = Date.now();
        response = await fetch('http://localhost:3000/download100', {
            method: 'GET',
        });
        end = Date.now();
        console.log('100MB :', end - start, 'ms');

        start = Date.now();
        response = await fetch('http://localhost:3000/download1000', {
            method: 'GET',
        });
        end = Date.now();
        console.log('1000MB :', end - start, 'ms');
        
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        } catch (error) {
        console.error('Error fetching the file:', error);
    }
}

fetchAndProcessFile();
