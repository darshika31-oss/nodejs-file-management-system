const http=require("http");
const path=require("path");
const fs=require("fs");
const url=require("url");

const server=http.createServer((req,res)=>{
   if(req.method==="GET"&&req.url==="/"){
    const filepath=path.join(__dirname,"public","index.html");
   fs.readFile(filepath,"utf8",(err,data)=>{
      if(err){
         res.end("Something went wrong");
      }
      else{
         res.end(data);
      }
   })
   }

   if(req.method==="GET"&&req.url==="/style.css"){
      const filepath=path.join(__dirname,"public","style.css");
      fs.readFile(filepath,"utf8",(error,data)=>{
         if(error){
            res.end("Something went wrong in reading style.css file");
         }
         else{
            res.setHeader("content-type","text/css");
            res.end(data);
         }
      })
   }

   if(req.method==="GET"&&req.url==="/app.js"){
      const filepath=path.join(__dirname,"public","app.js");
      fs.readFile(filepath,"utf8",(err,data)=>{
         if(err){
            res.end("Something went wrong in reading js file");
         }
         else{
            res.setHeader("content-type","application/javascript");
            res.end(data);
         }
      });
   }

   if(req.method==="GET"&&req.url==="/app1.js"){
      const filepath=path.join(__dirname,"public","app1.js");
      fs.readFile(filepath,"utf8",(err,data)=>{
         if(err){
            res.end("Something went wrong in reading js file");
         }
         else{
            res.setHeader("content-type","application/javascript");
            res.end(data);
         }
      });
   }

    if(req.method==="POST"&&req.url==="/api/createFile"){
       let data="";
       req.on("data",(chunk)=>{
           data=data+chunk;
       })
       req.on("end",()=>{
          const fileData=JSON.parse(data);
          console.log(fileData);
          const filename=fileData.fileName;
          console.log(filename);
          
          // Validate filename
          if (!filename || filename.trim() === "") {
             res.end(JSON.stringify({message:"Please enter a filename"}));
             return;
          }
          
          // Validate filename to prevent directory traversal
          if(filename.includes("..")||filename.startsWith("/")||filename.includes("\\")){
             res.end(JSON.stringify({message:"Invalid filename"}));
             return;
          }
          
          const filepath=path.join(__dirname,"data",filename.trim());
         
          const filecontent=fileData.filecontent;
           console.log(filecontent);
           
           // Check if file already exists
           fs.access(filepath, fs.constants.F_OK, (err) => {
               if (!err) {
                   // File exists, return error
                   res.end(JSON.stringify({message:"File already exists. Please choose a different name."}));
                   return;
               }
               
               // File doesn't exist, create it
               fs.writeFile(filepath,filecontent,(err)=>{
                  if(err){
                     res.end(JSON.stringify({message:"Something went wrong in writing file"}));
                  }
                  else{
                     res.end(JSON.stringify({message:"File created successfully"}));
                  }
               });
           });
       })
    }

   // GET /api/files - List all files in data directory
   if(req.method==="GET"&&req.url==="/api/files"){
       const dataDir=path.join(__dirname,"data");
       fs.readdir(dataDir,(err,files)=>{
           if(err){
               res.writeHead(500,{"Content-Type":"application/json"});
               return res.end(JSON.stringify({error:"Could not read directory"}));
           }
           // Filter out directories, only return files
           const filePromises=files.map(file=>{
               const filePath=path.join(dataDir,file);
               return new Promise((resolve,reject)=>{
                   fs.stat(filePath,(err,stats)=>{
                       if(err){
                           resolve({name:file,isFile:false});
                       }else{
                           resolve({
                               name:file,
                               isFile:stats.isFile(),
                               size:stats.size,
                               modified:stats.mtime.toISOString()
                           });
                       }
                   });
               });
           });
           Promise.all(filePromises).then(fileStats=>{
               const filesData=fileStats
                   .filter(stat=>stat.isFile)
                   .map(stat=>({
                       name:stat.name,
                       size:stat.size,
                       modified:stat.modified
                   }));
               res.writeHead(200,{"Content-Type":"application/json"});
               res.end(JSON.stringify({files:filesData}));
           }).catch(err=>{
               res.writeHead(500,{"Content-Type":"application/json"});
               res.end(JSON.stringify({error:"Error processing files"}));
           });
       });
   }

    // GET /api/files/:filename - Read file content
    if(req.method==="GET"&&req.url.startsWith("/api/files/")){
        const pathname=url.parse(req.url).pathname;
        const parts=pathname.split("/");
        let filename=parts[parts.length-1]; // Get last part after /api/files/
        
        // Decode URL-encoded filename
        filename = decodeURIComponent(filename);
        
        // Validate filename to prevent directory traversal
        if(filename.includes("..")||filename.startsWith("/")||filename.includes("\\")){
            res.writeHead(400,{"Content-Type":"application/json"});
            return res.end(JSON.stringify({error:"Invalid filename"}));
        }
        
        const filePath=path.join(__dirname,"data",filename);
        fs.readFile(filePath,"utf8",(err,data)=>{
            if(err){
                if(err.code==="ENOENT"){
                    res.writeHead(404,{"Content-Type":"application/json"});
                    return res.end(JSON.stringify({error:"File not found"}));
                }
                res.writeHead(500,{"Content-Type":"application/json"});
                return res.end(JSON.stringify({error:"Could not read file"}));
            }
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({content:data,filename:filename}));
        });
    }

    // DELETE /api/files/:filename - Delete file
    if(req.method==="DELETE"&&req.url.startsWith("/api/files/")){
        const pathname=url.parse(req.url).pathname;
        const parts=pathname.split("/");
        let filename=parts[parts.length-1];
        
        // Decode URL-encoded filename
        filename = decodeURIComponent(filename);
        
        // Validate filename to prevent directory traversal
        if(filename.includes("..")||filename.startsWith("/")||filename.includes("\\")){
            res.writeHead(400,{"Content-Type":"application/json"});
            return res.end(JSON.stringify({error:"Invalid filename"}));
        }
        
        const filePath=path.join(__dirname,"data",filename);
        fs.unlink(filePath,err=>{
            if(err){
                if(err.code==="ENOENT"){
                    res.writeHead(404,{"Content-Type":"application/json"});
                    return res.end(JSON.stringify({error:"File not found"}));
                }
                res.writeHead(500,{"Content-Type":"application/json"});
                return res.end(JSON.stringify({error:"Could not delete file"}));
            }
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({message:"File deleted successfully"}));
        });
    }

   // GET /api/system-info - Get system information
   if(req.method==="GET"&&req.url==="/api/system-info"){
       const os=require("os");
       const systemInfo={
           os:{
               name:os.type(),
               platform:os.platform(),
               release:os.release(),
               version:os.version(),
               architecture:os.arch(),
               hostname:os.hostname(),
               uptime:os.uptime()
           },
           cpu:{
               model:os.cpus()[0]?.model||"Unknown",
               cores:os.cpus().length,
               speed:os.cpus()[0]?.speed||"Unknown"
               // Note: Load averages not reliable on Windows, skipping
           },
           memory:{
               total:os.totalmem(),
               free:os.freemem(),
               used:os.totalmem()-os.freemem()
           },
           node:{
               version:process.version,
               v8:process.versions.v8,
               platform:process.platform,
               architecture:process.arch,
               uptime:process.uptime(),
               memoryUsage:process.memoryUsage()
           },
           app:{
               port:3000,
               cwd:process.cwd()
           },
           network:(function(){
               try{
                   const interfaces=os.networkInterfaces();
                   const results={};
                   for(const name in interfaces){
                       const addrList=interfaces[name];
                       const validAddrs=addrList.filter(addr=>
                           addr.family==="IPv4"&&!addr.internal
                       ).map(addr=>addr.address);
                       if(validAddrs.length>0){
                           results[name]=validAddrs;
                       }
                   }
                   return results;
               }catch(e){
                   return {error:"Could not retrieve network info"};
               }
           })()
       };
       
       // Format memory values to readable format
       const formatBytes=(bytes)=>{
           if(bytes===0)return"0 Bytes";
           const k=1024;
           const sizes=["Bytes","KB","MB","GB"];
           const i=Math.floor(Math.log(bytes)/Math.log(k));
           return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+" "+sizes[i];
       };
       
       // Add formatted memory values
       systemInfo.memory.formatted={
           total:formatBytes(systemInfo.memory.total),
           free:formatBytes(systemInfo.memory.free),
           used:formatBytes(systemInfo.memory.used),
           usagePercent:((systemInfo.memory.used/systemInfo.memory.total)*100).toFixed(2)+"%"
       };
       
       res.writeHead(200,{"Content-Type":"application/json"});
       res.end(JSON.stringify(systemInfo));
   }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});