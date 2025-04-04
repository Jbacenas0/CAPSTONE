const db = require('../config/db');
const User = require('../models/userModel');


const getUserData = (req, res) => {
    const { id } = req.user;

    const query = `
    SELECT u.email, p.firstname, p.middlename, p.lastname
    FROM users u 
    JOIN pediatricians p ON u.id = p.user_id 
    WHERE u.id = ?
    `;

    db.execute(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).json({ message: 'Error fetching user data' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = results[0];
        res.json({
            email: userData.email,
            name: `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim(),
        });
    });
};


const getListUser = (req, res) => {
    q = 'select * from users'
    db.execute(q, (err, result) => {
        if (err) return console.log(err)

        return res.json(result)
    })

}
const getConverstation = (req, res) => {
    const { id } = req.params;

    // Updated SQL query to join the guardians table and fetch participant data
    const query = `
    SELECT 
        c.id AS conversation_id,
        u1.id AS user_id,
        u1.email,
        g.firstname AS firstname,
        g.lastname AS lastname
    FROM 
        conversation c
    LEFT JOIN 
        users u1 ON c.participant_1 = u1.id
    LEFT JOIN 
        guardians g ON u1.id = g.user_id
    WHERE 
        c.participant_1 = ? OR c.participant_2 = ?;
    `;

    db.execute(query, [id, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length < 1) {
            return res.json({ message: 'No conversations found' });
        }

        // Send the result directly
        res.json(result);
    });
};





const getMessages = (req, res) => {
    const { id } = req.params;
    
    const query = `SELECT sender, content, time from messages where conversation_id = ${id} ORDER BY time ASC;`
    db.execute(query,(err, result) => {
        if(err) return console.log(err);
        
        req.io.emit('receive', result);
        // console.log(result)
        return res.json(result)
    });
}


const sendMessage = (req, res) => {
    const {conversation_id, sender_id, content} = req.body;

    const query = `INSERT INTO messages (conversation_id, sender, content) VALUES ('${conversation_id}', '${sender_id}', '${content}');`;
    
    db.query(query, (err, result) => {
        if(err) return console.log(err);
    
        if(result){
            const query2 = `select * from messages where conversation_id = ${conversation_id};`

            db.query(query2, (err, result) => {
                req.io.emit('newMessage', result);
            })
        }
    })
}

const getPatientsForPediatrician = (req, res) => {
    const { type } = req.query; // Access the 'type' query parameter
  
    let sqlQuery;
  
    // Choose SQL query based on the 'type' parameter (appointments or consultations)
    if (type === 'appointments') {
      sqlQuery = `
        SELECT 
        a.id AS appointmentId,
        a.date,
        a.timeStart,
        a.timeEnd,
        a.description,
        a.status,
        CONCAT(g.firstname, ' ', g.middlename, ' ', g.lastname) AS guardianFullName,
        CONCAT(p.patientName) AS patientFullName,
        p.sex AS Sex,
        p.id AS PatientId,
        'appointment' AS type
        FROM appointments a
        JOIN guardians g ON a.guardianId = g.id
        JOIN patients p ON a.patientId = p.id
        WHERE a.status = 'approved'
        

      `;
    } else if (type === 'consultations') {
      sqlQuery = `
        SELECT 
        c.id AS consultationId,
        c.date,
        c.timeStart,
        c.timeEnd,
        c.description,
        c.status,
        CONCAT(g.firstname, ' ', g.middlename, ' ', g.lastname) AS guardianFullName,
        CONCAT(p.patientName) AS patientFullName,
        p.sex AS Sex,
        p.id AS PatientId,
        'consultation' AS type
        FROM consultations c
        JOIN guardians g ON c.guardianId = g.id
        JOIN patients p ON c.patientId = p.id
        WHERE c.status = 'approved'
        

      `;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
  
    // Execute the query
    db.execute(sqlQuery, [], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to retrieve data', error: err });
      }
      res.json({ patients: results });
    });
  };

  const getPatientForPediaDetails = (req, res) => {
    const { PatientId } = req.params; // PatientId from URL params
    const { type } = req.query; // Type: appointment or consultation
  
    let sqlQuery;
  
    // Query details based on the type (appointments or consultations)
    if (type === 'appointments') {
      sqlQuery = `
        SELECT 
          p.id AS PatientId,
          p.patientName AS patientFullName,
          p.sex AS Sex,
          p.birthdate,
          p.cellphone AS contactInfo,
          p.address,
          CONCAT(g.firstname, ' ', g.middlename, ' ', g.lastname) AS guardianFullName,
          g.contact AS guardianContact
        FROM appointments a
        JOIN patients p ON a.patientId = p.id
        JOIN guardians g ON a.guardianId = g.id
        WHERE p.id = ? AND a.status = 'approved'
      `;
    } else if (type === 'consultations') {
      sqlQuery = `
        SELECT 
          p.id AS PatientId,
          p.patientName AS patientFullName,
          p.sex AS Sex,
          p.birthdate,
          p.cellphone AS contactInfo,
          p.address,
          CONCAT(g.firstname, ' ', g.middlename, ' ', g.lastname) AS guardianFullName,
          g.contact AS guardianContact
        FROM consultations c
        JOIN patients p ON c.patientId = p.id
        JOIN guardians g ON c.guardianId = g.id
        WHERE p.id = ? AND c.status = 'approved'
      `;
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
  
    // Execute the query
    db.execute(sqlQuery, [PatientId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to retrieve data', error: err });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      res.json({ patient: results[0] });
    });
  };
  
  

module.exports = { 
    getUserData, 
    getListUser, 
    getConverstation,
    getMessages,
    sendMessage,
    getPatientsForPediatrician,
    getPatientForPediaDetails
};
