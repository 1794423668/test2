var defaultConfig = {
    dbType: process.env.NODE_DB_TYPE || "oracledb",
    user : process.env.NODE_ORACLEDB_USER || "cigproxy",
    password : process.env.NODE_ORACLEDB_PASSWORD || "cigproxy",
    connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "106.3.44.26:11421/xe",
};
module.exports = defaultConfig;