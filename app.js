const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login_test_02'
});

// Set EJS as the view engine
app.set('view engine', 'ejs');


// Serve static files from the "public" directory
app.use(express.static('public'));




// Configure session middleware
app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Set up routes
app.use(express.urlencoded({
  extended: true
}));


const noCache = app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

//session authorization
//session authorization
//session authorization

app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    if (req.session.role === 'user') {
      res.redirect('/emp_dash');
    } else if (req.session.role === 'admin') {
      res.redirect('/admin_dash');
    }
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('login');
  }
});

// login - authentication
// login - authentication
// login - authentication

app.post('/login', (req, res) => {
  const {
    username,
    password,
    loginType
  } = req.body;
  // console.log(loginType);
  const query = `SELECT * FROM users WHERE username = ? AND role = ?`;

  pool.query(query, [username, loginType], (error, results) => {
    if (error || results.length === 0) {
      res.redirect('/'); // Redirect to login page if login fails
    } else {
      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          res.redirect('/');
        } else {
          // Set 'no-store' cache-control header to prevent caching of the welcome or admin pages
          // res.set('Cache-Control', 'no-store');

          req.session.loggedIn = true;
          req.session.username = username;
          req.session.role = loginType;

          if (loginType === 'user') {
            res.redirect('/emp_dash');
          } else if (loginType === 'admin') {
            res.redirect('/admin_dash');
          }
        }
      });
    }
  });
});

// Get product details by ID
// Get product details by ID
// Get product details by ID

app.get('/products/:id', (req, res) => {
  const prod_id = req.params.id;

  // Retrieve the product name and brand name from the "products" table
  const getProductQuery = 'SELECT prod_name, brand_name ,prod_cat,prod_variant,mrp FROM products WHERE prod_id = ?';
  const getProductValues = [prod_id];

  pool.query(getProductQuery, getProductValues, (error, results) => {
    if (error) {
      console.error('Error retrieving product details:', error);
      res.status(500).json({
        error: 'Internal Server Error'
      });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({
        error: 'Product not found'
      });
      return;
    }

    const productDetails = results[0];
    res.status(200).json(productDetails);
  });
});


//get employee details by emp_id
//get employee details by emp_id
//get employee details by emp_id

app.get('/employee_details', (req, res) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    // Render admin dashboard with products data
    const emp_id = req.query.emp_id;

    // Assuming you have a MySQL connection pool named 'pool'
    const searchQuery = 'SELECT * FROM employee WHERE emp_id = ?';

    pool.query(searchQuery, emp_id, (error, results) => {
      if (error) {
        console.error('Error searching employee:', error);
        res.redirect('/employee_search');
      } else {
        const employee = results.length > 0 ? results[0] : null;
        res.render('employee_details', { employee });
      }
    });
  }
});

//get customer details using customer id
//get customer details using customer id
//get customer details using customer id

app.get('/customer_details', (req, res) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
  const cust_id = req.query.cust_id;

  // Assuming you have a MySQL connection pool named 'pool'
  const searchQuery = 'SELECT * FROM customer WHERE cust_id = ?';

  pool.query(searchQuery, cust_id, (error, results) => {
    if (error) {
      console.error('Error searching customer:', error);
      res.redirect('/customer_search');
    } else {
      const customer = results.length > 0 ? results[0] : null;
      res.render('customer_details', { customer });
    }
  });
}
});


//search products using prod_id or brand_name prod_name combination.
//search products using prod_id or brand_name prod_name combination.
//search products using prod_id or brand_name prod_name combination.

app.get('/prod-search', (req, res) => {
  const searchType = req.query.searchType;
  const searchInput = req.query.searchInput.toLowerCase();

  let query = '';
  if (searchType === 'prod_id') {
    query = `SELECT * FROM products WHERE prod_id = ${searchInput}`;
  } else if (searchType === 'brand_prod') {
    query = `SELECT * FROM products WHERE CONCAT(brand_name, ' ', prod_name) LIKE '%${searchInput}%'`;
  }

  pool.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
    } else {
      res.render('prod-search', { results });
    }
  });
});





// ...get dashbboards
// ...get dashbboards
// ...get dashbboards


app.get('/emp_dash', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    // Render admin dashboard with products data
    const lowQuantityQuery = `SELECT * FROM products WHERE prod_quantity < 10`;
    pool.query(lowQuantityQuery, (err, lowQuantityProducts) => {
      if (err) {
        console.error('Database query error:', err);
      } else {
        res.render('emp_dash', {
          username: req.session.username,
          lowQuantityProducts: lowQuantityProducts
        });
      }
    });
  }
});


// app.get('/admin_dash', (req, res, next) => {
//   if (!req.session.loggedIn || req.session.role !== 'admin') {
//     res.redirect('/');
//   } else {
//     res.set('Cache-Control', 'no-store');
//     // Render admin dashboard with products data
//
//     res.render('admin_dash', {
//       username: req.session.username
//     });
//   }
// });
app.get('/admin_dash', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const lowQuantityQuery = `SELECT * FROM products WHERE prod_quantity < 10`;
    pool.query(lowQuantityQuery, (err, lowQuantityProducts) => {
      if (err) {
        console.error('Database query error:', err);
      } else {
        res.render('admin_dash', {
          username: req.session.username,
          lowQuantityProducts: lowQuantityProducts
        });
      }
    });
  }
});


//employee functions - rendering diff pages in employee
//employee functions - rendering diff pages in employee
//employee functions - rendering diff pages in employee


app.get('/emp_addprod', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    // res.set('Cache-Control', 'no-store');
    res.render('emp_addprod', {
      username: req.session.username
    });
  }
});

app.get('/emp_addpurchase', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    // res.set('Cache-Control', 'no-store');
    res.render('emp_addpurchase', {
      username: req.session.username
    });
  }
});

app.get('/emp_addsales', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    // res.set('Cache-Control', 'no-store');
    res.render('emp_addsales', {
      username: req.session.username
    });
  }
});

app.get('/emp_addcust', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    // res.set('Cache-Control', 'no-store');
    res.render('emp_addcust', {
      username: req.session.username
    });
  }
});

//admin functions - rendering diff pages in admin
//admin functions - rendering diff pages in admin
//admin functions - rendering diff pages in admin

app.get('/adm_addprod', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_addprod', {
      username: req.session.username,
      data: 2
    });
  }
});


app.get('/adm_addpurchase', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_addpurchase', {
      username: req.session.username,
      data: 2
    });
  }
});

app.get('/adm_addsales', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_addsales', {
      data:2
    });
  }
});

app.get('/adm_addcust', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_addcust', {
      username: req.session.username
    });
  }
});

app.get('/adm_addemp', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_addemp', {
      username: req.session.username
    });
  }
});

app.get('/search_employee', (req, res,next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('search_employee');
  }
});

app.get('/customer_search', (req, res) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    res.render('adm_customer_search');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});



//admin functionalities - view data
//admin functionalities - view data
//admin functionalities - view data


app.get('/adm_view_products', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM products';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('adm_view_products', {
          products: results, username: req.session.username
        });

      });
    });
  }
});


app.get('/adm_viewsales', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM sales';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('adm_viewsales', {
          sales: results
        });

      });
    });
  }
});


app.get('/adm_view_purchase', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM purchase';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('adm_view_purchase', {
          purchase: results
        });

      });
    });
  }
});


app.get('/adm_viewcustomer', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM customer';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('adm_viewcustomer', {
          customers: results
        });

      });
    });
  }
});


app.get('/adm_viewemployee', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM employee';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('adm_viewemployee', {
          employees: results
        });

      });
    });
  }
});


//admin functionalities - add data
//admin functionalities - add data
//admin functionalities - add data


app.post('/adm_addprod', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const {
      prod_cat,
      brand_name,
      prod_name,
      prod_variant,
      mrp,
      prod_quantity
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/adm_dash')
        return;
      }

      const insertQuery = 'INSERT INTO products (prod_cat, brand_name, prod_name, prod_variant , mrp , prod_quantity) VALUES (?, ?, ? , ?, ?, ?)';
      const values = [prod_cat, brand_name, prod_name, prod_variant, mrp, prod_quantity];

      connection.query(insertQuery, values, (error, result) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.error('Error inserting product:', error);
          console.log("error in adding product");
          res.render('adm_addprod', {data: 0})
          return;
        }


        console.log('Product added successfully!');
        // alert("Product added successfully!");
        res.render('adm_addprod', {data: 1});
      });
    });
  }
})


app.post('/adm_addpurchase', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const {
      prod_id,
      brand_name,
      prod_name,
      prod_cat,
      prod_variant,
      purchase_price,
      purchase_quantity,
      purchase_date,
      product_mrp,
      total_purchase_price
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/admin_dash');
        return;
      }

      const insertQuery = 'INSERT INTO purchase ( prod_id , brand_name, prod_name , prod_cat , prod_variant , purchase_price , purchase_quantity , purchase_date , product_mrp , total_purchase_price ) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)';
      const values = [prod_id, brand_name, prod_name, prod_cat, prod_variant, purchase_price, purchase_quantity, purchase_date, product_mrp, total_purchase_price];

      const updateProductQuery = 'UPDATE products SET prod_quantity = prod_quantity + ? WHERE prod_id = ?';
      const updateProductValues = [purchase_quantity, prod_id];

      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error('Error starting database transaction:', transactionErr);
          res.redirect('/admin_dash');
          return;
        }

        connection.query(insertQuery, values, (insertError, insertResult) => {
          if (insertError) {
            console.error('Error inserting purchase:', insertError);
            connection.rollback(() => {
              res.redirect('/admin_dash');
            });
            return;
          }

          connection.query(updateProductQuery, updateProductValues, (updateError, updateResult) => {
            if (updateError) {
              console.error('Error updating product quantity:', updateError);
              connection.rollback(() => {
                res.redirect('/admin_dash');
              });
              return;
            }

            connection.commit((commitError) => {
              if (commitError) {
                console.error('Error committing transaction:', commitError);
                connection.rollback(() => {
                  res.redirect('/admin_dash');
                });
                return;
              }

              console.log('Purchase added successfully!');
              res.render('adm_addpurchase', {
                data: 1
              });
            });
          });
        });
      });
    });
  }
});


app.post('/adm_addsales', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    const {

      sale_date,
      cust_id,
      prod_id,
      brand_name,
      prod_name,
      prod_variant,
      sale_quantity,
      mrp,
      total_price
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/admin_dash');
        return;
      }

      const insertQuery = 'INSERT INTO sales ( sale_date, cust_id, prod_id, brand_name,  prod_name, prod_variant,  sale_quantity, mrp, total_price ) VALUES (?, ?, ?, ?, ?, ?,?,?,?)';
      const values = [sale_date, cust_id, prod_id, brand_name, prod_name, prod_variant, sale_quantity, mrp, total_price];

      const updateProductQuery = 'UPDATE products SET prod_quantity = prod_quantity - ? WHERE prod_id = ?';
      const updateProductValues = [sale_quantity, prod_id];

      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error('Error starting database transaction:', transactionErr);
          res.redirect('/admin_dash');
          return;
        }

        connection.query(insertQuery, values, (insertError, insertResult) => {
          if (insertError) {
            console.error('Error inserting purchase:', insertError);
            connection.rollback(() => {
              res.redirect('/admin_dash');
            });
            return;
          }

          connection.query(updateProductQuery, updateProductValues, (updateError, updateResult) => {
            if (updateError) {
              console.error('Error updating product quantity:', updateError);
              connection.rollback(() => {
                res.redirect('/admin_dash');
              });
              return;
            }

            connection.commit((commitError) => {
              if (commitError) {
                console.error('Error committing transaction:', commitError);
                connection.rollback(() => {
                  res.redirect('/admin_dash');
                });
                return;
              }

              console.log('Sales added successfully!');
              res.render('adm_addsales', {
                data:1
              });
            });
          });
        });
      });
    });
  }
});


app.post('/adm_addcust', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');
    const {
      cust_id,
      cust_name,
      cust_phone,
      cust_address,
      cust_gender,
      cust_age
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/adm_dash')
        return;
      }

      const insertQuery = 'INSERT INTO customer (cust_name, cust_phone, cust_address, cust_gender,cust_age) VALUES (?, ?, ? , ?, ?)';
      const values = [cust_name, cust_phone, cust_address, cust_gender, cust_age];

      connection.query(insertQuery, values, (error, result) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.error('Error inserting product:', error);
          console.log("error in adding product");
          res.render("/adm_dash")
          return;
        }

        console.log('Cust added successfully!');
        // alert("Product added successfully!");
        res.render('adm_addcust', {
          username: req.session.username,
          // products: results,
        });
      });
    });
  }
})


app.post('/adm_addemp', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'admin') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const {
      emp_id,
      emp_name,
      emp_address,
      emp_datejoin,
      emp_gender,
      emp_salary,
      emp_dob,
      emp_phone
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/admin_dash')
        return;
      }

      const insertQuery = 'INSERT INTO employee (emp_id, emp_name,emp_address, emp_datejoin,emp_gender, emp_salary,emp_dob, emp_phone) VALUES (?, ?, ? , ?, ?, ?, ?, ?)';
      const values = [emp_id, emp_name, emp_address, emp_datejoin, emp_gender, emp_salary, emp_dob, emp_phone];

      connection.query(insertQuery, values, (error, result) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.error('Error inserting product:', error);
          console.log("error in adding product");
          res.render("/admin_dash")
          return;
        }

        console.log('Cust added successfully!');
        // alert("Product added successfully!");
        res.render('adm_addemp', {
          username: req.session.username,
          // products: results,
        });
      });
    });
  }
})



//employee functionalities - view data
//employee functionalities - view data
//employee functionalities - view data



app.get('/emp_view_products', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM products';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('emp_view_products', {
          products: results
        });

      });
    });
  }
});


app.get('/emp_view_purchase', (req, res) => {

  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        res.redirect('/welcome');
        return;
      }

      const selectQuery = 'SELECT * FROM purchase';

      connection.query(selectQuery, (error, results) => {
        connection.release();

        if (error) {
          console.error('Error retrieving products:', error);
          res.redirect('/welcome');
          return;
        }

        res.render('emp_view_purchase', {
          purchase: results
        });

      });
    });
  }
});


//employee functionalities - add data
//employee functionalities - add data
//employee functionalities - add data


app.post('/emp_addprod', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const {
      prod_cat,
      brand_name,
      prod_name,
      prod_variant,
      mrp,
      prod_quantity
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/adm_dash')
        return;
      }

      const insertQuery = 'INSERT INTO products (prod_cat, brand_name, prod_name, prod_variant, mrp , prod_quantity) VALUES (?, ?, ? , ?, ?, ?)';
      const values = [prod_cat, brand_name, prod_name, prod_variant, mrp, prod_quantity];

      connection.query(insertQuery, values, (error, result) => {
        connection.release(); // Release the connection back to the pool

        if (error) {
          console.error('Error inserting product:', error);
          console.log("error in adding product");
          res.redirect("/adm_dash")
          return;
        }

        console.log('Product added successfully!');
        res.render('admin_dash', {
          username: req.session.username
        });
      });
    });
  }
})


app.post('/emp_addpurchase', (req, res, next) => {
  if (!req.session.loggedIn || req.session.role !== 'user') {
    res.redirect('/');
  } else {
    res.set('Cache-Control', 'no-store');

    const {
      prod_id,
      brand_name,
      prod_name,
      prod_cat,
      prod_variant,
      purchase_price,
      purchase_quantity,
      purchase_date,
      product_mrp,
      total_purchase_price
    } = req.body;

    // Perform database insertion
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        console.log('Cant connect to db');
        res.redirect('/admin_dash');
        return;
      }

      const insertQuery = 'INSERT INTO purchase ( prod_id , brand_name, prod_name , prod_cat , prod_variant , purchase_price , purchase_quantity , purchase_date , product_mrp , total_purchase_price ) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)';
      const values = [prod_id, brand_name, prod_name, prod_cat, prod_variant, purchase_price, purchase_quantity, purchase_date, product_mrp, total_purchase_price];

      const updateProductQuery = 'UPDATE products SET prod_quantity = prod_quantity + ? WHERE prod_id = ?';
      const updateProductValues = [purchase_quantity, prod_id];

      connection.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error('Error starting database transaction:', transactionErr);
          res.redirect('/admin_dash');
          return;
        }

        connection.query(insertQuery, values, (insertError, insertResult) => {
          if (insertError) {
            console.error('Error inserting purchase:', insertError);
            connection.rollback(() => {
              res.redirect('/admin_dash');
            });
            return;
          }

          connection.query(updateProductQuery, updateProductValues, (updateError, updateResult) => {
            if (updateError) {
              console.error('Error updating product quantity:', updateError);
              connection.rollback(() => {
                res.redirect('/admin_dash');
              });
              return;
            }

            connection.commit((commitError) => {
              if (commitError) {
                console.error('Error committing transaction:', commitError);
                connection.rollback(() => {
                  res.redirect('/admin_dash');
                });
                return;
              }

              console.log('Purchase added successfully!');
              res.render('emp_addpurchase', {
                username: req.session.username
              });
            });
          });
        });
      });
    });
  }
});


//admin functionalities - updation/deletion of data


//update employees
//update employees
//update employees


app.get('/employee_update/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;

  // Assuming you have a MySQL connection pool named 'pool'
  const searchQuery = 'SELECT * FROM employee WHERE emp_id = ?';

  pool.query(searchQuery, emp_id, (error, results) => {
    if (error) {
      console.error('Error searching employee:', error);
      res.redirect(`/employee_details?emp_id=${emp_id}`);
    } else {
      const employee = results.length > 0 ? results[0] : null;
      res.render('employee_update', { employee });
    }
  });
});

app.post('/employee_update/:emp_id', (req, res) => {
  const emp_id = req.params.emp_id;
  const { emp_name, emp_salary } = req.body;

  // Assuming you have a MySQL connection pool named 'pool'
  const updateQuery = 'UPDATE employee SET emp_name = ?, emp_salary = ? WHERE emp_id = ?';
  const values = [emp_name, emp_salary, emp_id];

  pool.query(updateQuery, values, (error, results) => {
    if (error) {
      console.error('Error updating employee:', error);
      res.redirect(`/employee_update/${emp_id}`);
    } else {
      console.log('Employee updated successfully');
      res.redirect(`/employee_details?emp_id=${emp_id}`);
    }
  });
});


//update customers
//update customers
//update customers


app.get('/customer_update/:cust_id', (req, res) => {
  const cust_id = req.params.cust_id;

  // Assuming you have a MySQL connection pool named 'pool'
  const searchQuery = 'SELECT * FROM customer WHERE cust_id = ?';

  pool.query(searchQuery, cust_id, (error, results) => {
    if (error) {
      console.error('Error searching customer:', error);
      res.redirect(`/customer_details?cust_id=${cust_id}`);
    } else {
      const customer = results.length > 0 ? results[0] : null;
      res.render('customer_update', { customer });
    }
  });
});

app.post('/customer_update/:cust_id', (req, res) => {
  const cust_id = req.params.cust_id;
  const { cust_name, cust_phone } = req.body;

  // Assuming you have a MySQL connection pool named 'pool'
  const updateQuery = 'UPDATE customer SET cust_name = ?, cust_phone = ? WHERE cust_id = ?';
  const values = [cust_name, cust_phone, cust_id];

  pool.query(updateQuery, values, (error, results) => {
    if (error) {
      console.error('Error updating customer:', error);
      res.redirect(`/customer_update/${cust_id}`);
    } else {
      console.log('Customer updated successfully');
      res.redirect(`/customer_details?cust_id=${cust_id}`);
    }
  });
});


//search and update purchase



app.get('/search-purchase', (req, res) => {
  res.render('search-purchase', { searchResult: null });
});


app.post('/search-purchase', (req, res) => {
  const { search_option, purchase_id, brand_name, prod_name } = req.body;

  let searchQuery = 'SELECT * FROM purchase WHERE ';
  const queryParams = [];

  if (search_option === 'purchase_id') {
    searchQuery += 'purchase_id = ?';
    queryParams.push(purchase_id);
  } else if (search_option === 'brand_name_prod_name') {
    searchQuery += 'brand_name = ? AND prod_name = ?';
    queryParams.push(brand_name, prod_name);
  } else {
    // No valid search criteria provided
    return res.redirect('/search-purchase');
  }

  pool.query(searchQuery, queryParams, (error, results) => {
    if (error) {
      console.error('Error searching purchase:', error);
      return res.render('update-purchase', { searchResult: null });
    }

    res.render('update-purchase', { searchResult: results });
  });
});


// Route to show the update form
// Display the update form
// Handle the update submission
// Route to fetch product details based on prod_id
app.get('/get-product-details/:prod_id', (req, res) => {
  const prodId = req.params.prod_id;

  // Fetch product details from the database based on prod_id
  pool.query('SELECT * FROM products WHERE prod_id = ?', [prodId], (error, results) => {
    if (error) {
      console.error('Error fetching product details:', error);
      return res.status(500).json({ error: 'Error fetching product details' });
    }

    const productDetails = results[0];

    if (!productDetails) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(productDetails);
  });
});

app.post('/update-purchase/:purchase_id', (req, res) => {
  const purchaseId = req.params.purchase_id;
  const { purchase_quantity, purchase_price } = req.body;

  // Fetch the original purchase details
  pool.query('SELECT * FROM purchase WHERE purchase_id = ?', [purchaseId], (error, results) => {
    if (error) {
      console.error('Error fetching original purchase details:', error);
      return res.redirect('/search-purchase');
    }

    const originalPurchase = results[0];

    if (!originalPurchase) {
      return res.redirect('/search-purchase');
    }

    const {
      purchase_quantity: originalQuantity,
      purchase_price: originalPrice,
      prod_id: prodId
    } = originalPurchase;

    // Update the purchase record
    pool.query(
      'UPDATE purchase SET purchase_quantity = ?, purchase_price = ? WHERE purchase_id = ?',
      [purchase_quantity, purchase_price, purchaseId],
      (error) => {
        if (error) {
          console.error('Error updating purchase:', error);
          return res.redirect(`/update-purchase/${purchaseId}`);
        }

        // Update corresponding product quantity and total_purchase_price if needed
        if (originalQuantity !== purchase_quantity || originalPrice !== purchase_price) {
          const newTotalPrice = purchase_quantity * purchase_price;

          pool.query(
            'UPDATE purchase SET total_purchase_price = ? WHERE purchase_id = ?',
            [newTotalPrice, purchaseId],
            (error) => {
              if (error) {
                console.error('Error updating total_purchase_price:', error);
                return res.redirect(`/update-purchase/${purchaseId}`);
              }

              // Calculate the difference in quantity
              const differenceQuantity = purchase_quantity - originalQuantity;

              // Update prod_quantity in products table
              pool.query(
                'UPDATE products SET prod_quantity = prod_quantity + ? WHERE prod_id = ?',
                [differenceQuantity, prodId],
                (error) => {
                  if (error) {
                    console.error('Error updating prod_quantity:', error);
                    return res.redirect(`/update-purchase/${purchaseId}`);
                  }

                  console.log('Purchase updated successfully');
                  res.redirect('/search-purchase'); // Redirect back to the search page
                }
              );
            }
          );
        } else {
          console.log('Purchase updated successfully');
          res.redirect('/search-purchase'); // Redirect back to the search page
        }
      }
    );
  });
});


//search and update Sales
// Assuming you have already created the `pool` variable for database connection

// Display the search results

app.get('/search-sale', (req, res) => {
  res.render('search-sale', { searchResult: null });
});

// Assuming you have already created the `pool` variable for database connection

// Display the search results
// Display the search results
app.post('/search-sale', (req, res) => {
  const { search_option, sale_id, brand_name, prod_name } = req.body;

  let searchQuery, queryParams;

  if (!search_option) {
    console.error('Missing search option');
    return res.redirect('/search-sale');
  }

  if (search_option === 'sale_id') {
    if (!sale_id) {
      console.error('Missing sale_id');
      return res.redirect('/search-sale');
    }
    searchQuery = 'SELECT * FROM sales WHERE sale_id = ?';
    queryParams = [sale_id];
  } else if (search_option === 'brand_name_prod_name') {
    if (!brand_name || !prod_name) {
      console.error('Missing brand_name or prod_name');
      return res.redirect('/search-sale');
    }
    searchQuery = 'SELECT * FROM sales WHERE brand_name = ? AND prod_name = ?';
    queryParams = [brand_name, prod_name];
  } else {
    console.error('Invalid search option:', search_option);
    return res.redirect('/search-sale');
  }

  pool.query(searchQuery, queryParams, (error, searchResult) => {
    if (error) {
      console.error('Error searching sales:', error);
      return res.redirect('/search-sale');
    }

    res.render('update-sale-purc', { searchResult });
  });
});


// Handle the update submission
app.post('/update-sale/:sale_id', (req, res) => {
  const saleId = req.params.sale_id;
  const { sale_quantity, mrp, total_price } = req.body;

  // Update the sale record
  pool.query(
    'UPDATE sales SET sale_quantity = ?, mrp = ?, total_price = ? WHERE sale_id = ?',
    [sale_quantity, mrp, total_price, saleId],
    (error) => {
      if (error) {
        console.error('Error updating sale:', error);
        return res.redirect(`/update-sale/${saleId}`);
      }

      console.log('Sale updated successfully');
      res.redirect('/search-sale'); // Redirect back to the search page
    }
  );
});



app.post('/update-sale/:sale_id', (req, res) => {
  const sale_id = req.params.sale_id;
  const { sale_quantity, mrp } = req.body;

  // Fetch the original purchase details
  pool.query('SELECT * FROM sales WHERE sale_id = ?', [sale_id], (error, results) => {
    if (error) {
      console.error('Error fetching original purchase details:', error);
      return res.redirect('/search-sale');
    }

    const originalsales = results[0];

    if (!originalPurchase) {
      return res.redirect('/search-purchase');
    }

    const {
      sale_quantity: originalQuantity,
      mrp: originalMrp,
      prod_id: prodId
    } = originalPurchase;

    // Update the purchase record
    pool.query(
      'UPDATE sales SET sale_quantity = ?, mrp = ? WHERE sale_id = ?',
      [sale_quantity, mrp, sale_id],
      (error) => {
        if (error) {
          console.error('Error updating sale:', error);
          return res.redirect(`/update-sale/${sale_id}`);
        }

        // Update corresponding product quantity and total_purchase_price if needed
        if (originalQuantity !== sale_quantity || originalMrp !== mrp) {
          const newTotalPrice = sale_quantity * mrp;

          pool.query(
            'UPDATE sales SET total_price = ? WHERE sale_id = ?',
            [newTotalPrice, sale_id],
            (error) => {
              if (error) {
                console.error('Error updating total_price:', error);
                return res.redirect(`/update-sale/${sale_id}`);
              }

              // Calculate the difference in quantity
              const differenceQuantity = sale_quantity - originalQuantity;

              // Update prod_quantity in products table
              pool.query(
                'UPDATE products SET prod_quantity = prod_quantity - ? WHERE prod_id = ?',
                [differenceQuantity, sale_id],
                (error) => {
                  if (error) {
                    console.error('Error updating sale_quantity:', error);
                    return res.redirect(`/update-sale/${sale_id}`);
                  }

                  console.log('Sale updated successfully');
                  res.redirect('/search-sale'); // Redirect back to the search page
                }
              );
            }
          );
        } else {
          console.log('Sale updated successfully');
          res.redirect('/search-sale'); // Redirect back to the search page
        }
      }
    );
  });
});



//generate sales reportData

app.get('/sales-report', (req, res) => {
  res.render('sales-report', { reportData: null });
});

// Route for generating the sales report
app.post('/generate-report', (req, res) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;

  const query = `
    SELECT sale_id, sale_date, cust_id, prod_id, brand_name, prod_name, prod_variant,
           sale_quantity, mrp, total_price
    FROM sales
    WHERE sale_date BETWEEN ? AND ?
  `;

  pool.query(query, [fromDate, toDate], (error, results) => {
    if (error) {
      console.error('Error fetching sales report:', error);
      res.sendStatus(500);
      return;
    }

    const totalUnitsSold = results.reduce((total, item) => total + item.sale_quantity, 0);
    const totalRevenue = results.reduce((total, item) => total + item.total_price, 0);

    const productsSold = {};
    results.forEach(item => {
      if (!productsSold[item.prod_id]) {
        productsSold[item.prod_id] = { ...item };
        productsSold[item.prod_id].unitsSold = 0;
      }
      productsSold[item.prod_id].unitsSold += item.sale_quantity;
    });

    const mostSoldItem = Object.values(productsSold).reduce((mostSold, item) => {
      return item.unitsSold > mostSold.unitsSold ? item : mostSold;
    }, { unitsSold: 0 });

    res.render('sales-report', {
      reportData: results,
      totalUnitsSold: totalUnitsSold,
      totalRevenue: totalRevenue,
      mostSoldItem: mostSoldItem
    });
  });
});



//Generate invoice
// Route for generating the invoice


// ... Other routes and app.listen ...

//server listen for incoming requestst
//server listen for incoming requestst
//server listen for incoming requestst

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
