const mongoose = require('mongoose');


let schema = new mongoose.Schema(
    {
        nearLoc : String,
        pname: String, 
        pdesc: String, 
        price: Number, 
        category: String, 
        pimage: String,
        pimage2: String,
        addedBy: mongoose.Schema.Types.ObjectId,
        pLoc : {
            type : {
                type : String,
                enum :['Point'],
                default : 'Point'
            },
            coordinates : {
                type : [Number]
            }
        }
})

schema.index({pLoc : "2dsphere"})

const Products = new mongoose.model('Products', schema);

module.exports.search = (req, res) => {
    let Search = req.query.search;
    let query = {};

    if (Search && Search.trim() !== '') {
        const searchLetters = Search.toLowerCase().split('');
        const letterChecks = searchLetters.map(letter => ({ nearLoc: { $regex: letter, $options: 'i' } }));
        
        query.$or = [
            {pname: { $regex: Search, $options: 'i' }},
            {pdesc: { $regex: Search, $options: 'i' }},
            {category: { $regex: Search, $options: 'i' }},
            { $and: letterChecks }
        ]
    } else if (req.query.loc) {
        let latitude = req.query.loc.split(',')[0]
        let longitude = req.query.loc.split(',')[1]
        
        query.pLoc = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates : [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: 50 * 1000,
            }
        }
    }

    Products.find(query)
    .then((result)=>{
        let responseMessage = 'success';
        if (req.query.loc) {
            responseMessage = 'Results shown within 50km radius of your selected location';
        }
        res.send({message : responseMessage, products : result})
    })
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}

module.exports.addProduct = (req,res) =>{

    const nearLoc = req.body.nearLoc;
    const plat = req.body.plat;
    const plong = req.body.plong;
    const pname = req.body.pname;
    const pdesc = req.body.pdesc;
    const price = req.body.price;
    const category = req.body.category;
    const pimage = req.files.pimage[0].path;
    const pimage2 = req.files.pimage2[0].path;
    const addedBy = req.body.userId;

    const product = new Products({nearLoc, pname, pdesc,  price, category, pimage,pimage2, addedBy, pLoc : { type :'Point', coordinates : [parseFloat(plong), parseFloat(plat)]
}
});

    product.save()
    .then(()=>{
        res.send({message: "Saved successfully"})
    })
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}

module.exports.editProduct = (req,res) =>{


    const pid = req.body.pid;
    const pname = req.body.pname;
    const pdesc = req.body.pdesc
    const price = req.body.price
    const category = req.body.category


    let pimage = '';
    let pimage2 = '';

    if(req.files && req.files.pimage && req.files.pimage.length > 0){
       pimage = req.files.pimage[0].path
    }
    if(req.files && req.files.pimage2 && req.files.pimage2.length > 0){
        pimage2 = req.files.pimage2[0].path
    }
    // const addedBy = req.body.userId;

//     const product = new Products({pname, pdesc,  price, category, pimage,pimage2, addedBy, pLoc : { type :'Point', coordinates : [plat , plong]
// }
// });

    let editObj = {}

    if(pname){
        editObj.pname = pname
    }
    if(pdesc){
        editObj.pdesc = pdesc
    }
    if(price){
        editObj.price = price
    }
    if(category){
        editObj.category = category
    }
    if(pimage){
        editObj.pimage = pimage
    }
    if(pimage2){
        editObj.pimage2 = pimage2
    }




    Products.updateOne({_id : pid}, editObj , {new : true} )
    .then((result)=>{
        res.send({message: "Saved successfully", products : result})
    })
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}

module.exports.getProduct = (req, res) =>{

    const catName = req.query.catName;

    let _f = { }
    if(catName){
        _f = {category: catName}
    }
    Products.find(_f)
    .then((result)=>{
        res.send({message : 'success', products : result})
    })  
    .catch((err)=>{ 
        res.status(500).send({message: 'server error', error: err.message})
    })
}

module.exports.getProductById = (req, res) =>{
    // console.log(req.params.pId, "id")

    Products.findOne( {_id : req.params.pId})
    .then((result)=>{
        res.send({message : 'success', products : result})
    })  
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}

module.exports.myProduct = (req, res) =>{


    const userId = req.body.userId;

    Products.find({addedBy : userId})
    .then((result)=>{
        res.send({message : 'success', products : result})
    })  
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}



module.exports.deleteProduct = (req, res) =>{
    const userId = req.body.userId;
    const pid = req.body.pid;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(pid)) {
        return res.status(400).send({message: 'Invalid ID format'});
    }

    Products.deleteOne({addedBy : new mongoose.Types.ObjectId(userId), _id : new mongoose.Types.ObjectId(pid)})
    .then(()=>{
        res.send({message : 'success'})
    })  
    .catch((err)=>{
        res.status(500).send({message: 'server error', error: err.message})
    })
}