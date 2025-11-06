const express = require('express');
const mysql = require('mysql2/promise');
const requestIp = require('request-ip');
const crypto = require('crypto');

const conn = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'escola'
})

const app = express();
app.use(express.json());
app.use(requestIp.mw());

const PORT = 3001;
app.listen(PORT);

app.get("/", (req, res) => {
    res.json({
        rotas: {
            "/":"GET - Obtem todas as rotas disponiveis",
            "/login":"POST - Recebe o Usuario e Senha para autentificar"
        }
    })
})

app.get("/cadastros", async (req, res) => {
    const Lnomes = "select * from usuarios_login";

    const [rows] = await conn.execute(Lnomes);

    res.json({
        cadastrados: {
            rows
        }
    })
})

app.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;
    const senhaHashh = crypto.createHash('sha256').update(senha).digest('hex');
 
    const agora = new Date();
    const dataHora = new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
 
    const ip = req.clientIp === '::1' ? '127.0.0.1' : req.clientIp;

    const sql = "SELECT * FROM usuarios_login WHERE nome_usuario = ? AND senha_hash = ?";
    const sqlLog = "INSERT INTO registro_logs (ip_usuario, data_hora, parametros, sql_executado, resultado) VALUES (?, ?, ?, ?, ?)";
    const parametros = JSON.stringify({ usuario, senhaHashh });
 
    try {
      const [rows] = await conn.execute(sql, [usuario, senhaHashh]);
 
        if (rows.length === 0) {
            await conn.execute(sqlLog, [
                ip,
                dataHora,
                parametros,
                sql,
                "Falha"
            ]);
           
            return res.json({
                msg: "Não encontrado"
            })
        }
       
        if (rows.length > 0) {
            await conn.execute(sqlLog, [
                ip,
                dataHora,
                parametros,
                sql,
                "Sucesso"
            ]);

            return res.json({
                msg: "Encontrado"
            });
        }
 
    } catch (err) {
        res.json({
            msg: "Deu errado"
        })
    }
  });