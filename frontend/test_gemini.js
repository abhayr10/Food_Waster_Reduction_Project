fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCX9mpzgzM7BTVPDShUuN3b0-Ovfve-r-E")
.then(res => res.json())
.then(data => {
    if(data.models) {
        console.log(data.models.map(m => m.name));
    } else {
        console.log("No models returned", data);
    }
});
