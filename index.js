'use strict'
const { DataApiClient } = require('rqlite-js')
const log = require('./logger')

const CACHE_HOSTS = process.env.REACTION_CACHE_URL || ['http://data-cache-0.data-cache-internal.datastore.svc.cluster.local:4001', 'http://data-cache-1.data-cache-internal.datastore.svc.cluster.local:4001', 'http://data-cache-2.data-cache-internal.datastore.svc.cluster.local:4001']

const dataApiClient = new DataApiClient(CACHE_HOSTS)
let TABLE_SET = new Set()

async function checkTableExists(table){
  try{
    if(TABLE_SET.has(table)) return true

    let sql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults?.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    if(dataResults?.get(0)?.data?.name == table){
      TABLE_SET.add(table)
      return true
    }
  }catch(e){
    log.error(e)
  }
}
async function createTable(table){
  try{
    let sql = `CREATE TABLE IF NOT EXISTS "${table}" (id TEXT PRIMARY KEY, data TEXT NOT NULL, ttl INTEGER)`
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    TABLE_SET.add(table)
    return true
  }catch(e){
    log.error(e)
  }
}
async function tableCheck(table){
  try{
    if(!table) return;

    let status = await checkTableExists(table)
    if(!status) status = await createTable(table)

    return status
  }catch(e){
    log.error(e)
  }
}
async function all(table){
  try{
    if(!table) return
    let status = await checkTableExists(table)
    if(!status) return

    let sql = `SELECT id, data FROM "${table}"`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    let result = dataResults?.toArray()?.filter(x=>x?.data)
    if(result?.length > 0){
      let res = {}
      for(let i in result){
        if(!result[i]?.id || !result[i]?.data) continue
        res[result[i].id] = JSON.parse(result[i].data)
      }
      return res
    }
  }catch(e){
    log.error(e)
  }
}
async function del(table, key){
  try{
    if(!table) return
    let status = await checkTableExists(table)
    if(!status) return

    let sql = `DELETE FROM "${table}" WHERE id="${key.toString()}"`
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    return dataResults?.get(0)?.getRowsAffected()
  }catch(e){
    log.error(e)
  }
}

async function get(table, key){
  try{
    if(!table) return
    let status = await checkTableExists(table)
    if(!status) return

    let sql = `SELECT data FROM "${table}" WHERE id="${key?.toString()}"`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    let result = dataResults?.get(0)
    if(result?.data?.data) return JSON.parse(result?.data?.data)
  }catch(e){
    log.error(e)
  }
}
async function getIds(table){
  try{
    if(!table) return
    let status = await checkTableExists(table)
    if(!status) return

    let sql = `SELECT id FROM "${table}"`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    return dataResults?.toArray()?.filter(x=>x?.id)?.map(x=>x.id)
  }catch(e){
    log.error(e)
  }
}

async function set(table, key, data){
  try{
    if(!table || !key || !data) return
    let status = await tableCheck(table)
    if(!status){
      log.error(`Could not create gamedata table for ${table}`)
      return
    }
    let sql = [
      [`INSERT OR REPLACE INTO "${table}" (id, data, ttl) VALUES(:id, :data, ${Date.now()})`, { id: key.toString(), data: JSON.stringify(data) }]
    ]
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      log.error(dataResults?.getFirstError())
      return
    }
    if(dataResults?.get(0)?.getRowsAffected() >= 0) return true
  }catch(e){
    log.error(e)
  }
}

module.exports = { all, del, get, set, tableCheck }
