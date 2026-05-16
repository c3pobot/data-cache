'use strict'
const log = require('./logger')

const { MongoClient } = require('mongodb');
const connectionString = 'mongodb://mongo-data-rs0.datastore.svc.cluster.local/admin?replicaSet=rs0&ssl=false&compressors=snappy&retryReads=true&retryWrites=true'
console.log(connectionString)
let mongo = new MongoClient(connectionString), mongo_ready = false, _dbo
async function init(){
  try{
    await mongo.connect()
    let status = await mongo.db('admin').command({ ping: 1 })
    if(status.ok > 0){
      mongo_ready = true
      _dbo = mongo.db('game_data')
      log.info(`mongo connection successful...`)
      return
    }
    setTimeout(init, 5000)
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
init()
async function aggregate( collection, matchCondition, data = []){
  try{
    if(matchCondition) data.unshift({$match: matchCondition})
    return await _dbo.collection(collection).aggregate(data, { allowDiskUse: true }).toArray()
  }catch(e){
    log.error(e)
  }
}
async function all( collection, matchCondition, project ){
  try{
    return await _dbo.collection( collection ).find( matchCondition, { projection: project } ).toArray()
  }catch(e){
    log.error(e)
  }
}
async function del( collection, matchCondition ){
  try{
    return await _dbo.collection(collection).deleteOne(matchCondition)
  }catch(e){
    log.error(e)
  }
}
async function delMany( collection, matchCondition ){
  try{
    return await _dbo.collection(collection).deleteMany(matchCondition)
  }catch(e){
    log.error(e)
  }
}
async function count( collection, matchCondition ){
  try{
    return await _dbo.collection( collection ).countDocuments(matchCondition)
  }catch(e){
    log.error(e)
  }
}
async function createIndex(collection, keys, opts = {}){
  try{
    if(!keys) throw('No index provided...')
    //opts = { background: true, expireAfterSeconds: 600 }
    return await _dbo.collection( collection ).createIndex(keys, opts)
  }catch(e){
    log.error(e)
  }
}
async function dropIndex( collection, indexName){
  try{
    if(!collection || !indexName) return
    let res = await _dbo.collection( collection ).dropIndex(indexName)
    if(res?.ok) return true
  }catch(e){
    log.error(e)
  }
}
async function get(collection, matchCondition, project){
  try{
    let res = await _dbo.collection( collection ).find( matchCondition, { projection: project } ).toArray()
    if(res?.length > 0) return res[0]
  }catch(e){
    log.error(e)
  }
}

async function listIndexes( collection ){
  try{
    return await _dbo.collection( collection ).listIndexes().toArray()
  }catch(e){
    log.error(e)
  }
}

async function limit( collection, matchCondition, project, limitCount = 50 ){
  try{
    return await _dbo.collection( collection ).find( matchCondition, { projection: project } ).limit( limitCount ).toArray()
  }catch(e){
    log.error(e)
  }
}

async function set( collection, matchCondition, data ){
  try{
    if(!data || !matchCondition || !collection) return
    if(!data?.TTL) data.TTL = new Date()
    let res = await _dbo.collection( collection ).updateOne( matchCondition, { $set: data }, { upsert: true } )
    delete data.TTL
    return res?.acknowledged
  }catch(e){
    log.error(e)
  }
}
async function updateIndex( collection, keys, opts ){
  try{
    if(!collection || !keys || !opts?.name) return
    let collections = await _dbo.listCollections()?.toArray()
    let indexCollection = collections.find(x=>x.name == collection)
    if(!indexCollection?.name){
      let created = await _dbo.createCollection(collection)
      if(created?.s?.namespace?.collection !== collection) return log.error(`error creating collection ${collection}...`)
      log.debug(`collection ${collection} created...`)
    }
    let indexes = await listIndexes( collection )
    let index = indexes?.find(x=>x.name == opts.name)
    if(index?.key && JSON.stringify(index.key) == JSON.stringify(keys)){
      if(!opts.expireAfterSeconds && !index.expireAfterSeconds) return true
      if(opts.expireAfterSeconds && opts.expireAfterSeconds == index.expireAfterSeconds) return true
      if(index.expireAfterSeconds && opts.expireAfterSeconds == index.expireAfterSeconds) return true
    }
    if(index?.name){
      let dropped = await dropIndex(collection, opts.name)
      if(!dropped) return log.error(`error dropping index index ${opts.name} for ${collection}...`)
      log.debug(`dropped ${collection} index ${opts.name}...`)
    }
    let indexName = await createIndex( collection, keys, opts)
    if(!indexName || indexName !== opts.name) return log.error(`error creating index ${opts.name} for ${collection}`)
    log.debug(`created index ${opts.name} for ${collection}...`)
    return true
  }catch(e){
    log.error(e)
  }
}
module.exports = {
  aggregate, all, del, delMany, count, createIndex, get, listIndexes, limit, set, status: ()=>( mongo_ready ), updateIndex
}
