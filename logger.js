let logLevel = process.env.LOG_LEVEL || 'info';
function getTimeStamp(timestamp){
  if(!timestamp) timestamp = Date.now()
  let dateTime = new Date(timestamp)
  return dateTime.toLocaleString('en-US', { timeZone: 'Etc/GMT+5', hour12: false })
}
function error(msg){
  try{
    console.error(`${getTimeStamp(Date.now())} ERROR [data-cache] ${msg}`)
    if(msg?.stack && logLevel == 'debug') console.error(msg)
  }catch(e){
    console.error(e)
  }
}
function info(msg){
  try{
    console.log(`${getTimeStamp(Date.now())} INFO [data-cache] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
function debug(msg){
  try{
    if(logLevel == 'debug') console.log(`${getTimeStamp(Date.now())} DEBUG [data-cache] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
module.exports = { error, debug, info }
