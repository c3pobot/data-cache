let logLevel = process.env.LOG_LEVEL || 'info';
function getTimeStamp(timestamp){
  if(!timestamp) timestamp = Date.now()
  let dateTime = new Date(timestamp)
  return dateTime.toLocaleString('en-US', { timeZone: 'Etc/GMT+5', hour12: false })
}
export function error(err, table_name){
  try{
    console.error(`${getTimeStamp(Date.now())} ERROR [data-cache] ${err}`)
    if(err?.stack && logLevel == 'debug') console.error(err)
  }catch(e){
    console.error(e)
  }
}
export function info(msg, table_name){
  try{
    console.log(`${getTimeStamp(Date.now())} INFO [data-cache] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
