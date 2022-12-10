const fs = require("fs");
const path = require("path");
const db = require("./../config/config");
var md5 = require("md5");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const { resolve } = require("path");
const { rejects } = require("assert");
const { error } = require("console");
router.get("/", (req, res) => {
  res.send("get Routes are working...");
  return;
});
// ------------------------------------------------------
// Get Routes
// get appartment-unit-mix
router.get("/get-appartment-unit-mix", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.query.id);
  console.log("myProperty" + propertyGuid);
  // Getting all appartments
  let sql = `SELECT properties.property_name,properties.property_type,properties.purchase_price,properties.full_name,properties.phone,properties.address,properties.city,properties.zipcode,properties.state, appartment_unit_mix.* FROM properties LEFT JOIN appartment_unit_mix ON properties.property_guid = appartment_unit_mix.property_guid where properties.property_guid = ${propertyGuid} AND properties.is_deleted = 0`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// get debts
router.get("/get-debts", (req, res) => {
  let propertyGuid = db.connection.escape(req.query.id);
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM debts WHERE property_guid = ${propertyGuid}`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      let sql = `SELECT purchase_price FROM properties WHERE property_guid = ${propertyGuid}`;
      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          return res.status(500).json({
            message: "Some Error Occured",
          });
        }
        data.push(result);
        return res.status(200).json({
          data,
        });
      });
    },
    (error) => {}
  );
});
// get notes
router.get("/get-notes/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  // Getting all debts
  let sql = `SELECT * FROM notes WHERE property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// get property-expense
router.get("/get-property-expenses", (req, res) => {
  let propertyGuid = db.connection.escape(req.query.id);
  let sql = `SELECT * FROM property_expenses WHERE property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// get property-income
router.get("/get-property-income", (req, res) => {
  let propertyGuid = db.connection.escape(req.query.id);
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM property_income WHERE property_guid = ${propertyGuid}`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      resolve(result);
    });
  });
  promiseOne.then((result) => {
    let sql = `SELECT * FROM unit_mix WHERE property_guid = ${propertyGuid}`;
    let query = db.Query(sql).then(({err, result:result1}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      result.push(result1);
      return res.status(200).json({
        result,
      });
    });
  });
});
// get Storage Unit Mix
router.get("/get-storage-unit-mix", (req, res) => {
  let propertyGuid = db.connection.escape(req.query.id);
  console.log("myProperty" + propertyGuid);
  // Getting all storage units

  let sql = `SELECT properties.property_name,properties.property_type,properties.purchase_price,properties.full_name,properties.phone,properties.address,properties.city,properties.zipcode,properties.state, storage_unit_mix.* FROM properties LEFT JOIN storage_unit_mix ON properties.property_guid = storage_unit_mix.property_guid where properties.property_guid = ${propertyGuid} AND properties.is_deleted = 0`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// get Subscription Plans
router.get("/get-subscription-plans", (req, res) => {
  // Getting all debts
  let sql = `SELECT * FROM subscription_plans`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// get prices
router.get("/get-subscription-plans-prices", (req, res) => {
  // Getting all debts
  let sql = `SELECT price,plan_name,subscription_plan_id from subscription_plans`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get email of user from guid
router.get("/original-email/:id", (req, res) => {
  let userGuid = db.connection.escape(req.params.id);

  let sql = `SELECT email from users WHERE user_guid = ${userGuid} and is_deleted = '0'`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// get User Subscription
router.get("/get-user-subscriptions", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let sql = `SELECT users.first_name,users.last_name,users.email as 'my_email', user_subscriptions.*, subscription_plans.plan_description,subscription_plans.price,
  subscription_plans.duration_in_months FROM users 
  LEFT JOIN user_subscriptions ON users.user_guid = user_subscriptions.user_guid 
  LEFT JOIN subscription_plans ON user_subscriptions.subscription_plan_id = subscription_plans.subscription_plan_id 
  WHERE users.user_guid = ${userGuid} and user_subscriptions.is_deleted = '0'`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get verification of payment
router.get("/get-payment-verification", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let sql = `SELECT * FROM user_subscriptions WHERE user_guid = ${userGuid} and is_deleted = '0'`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    if (result.length > 0) {
      return res.status(200).json({
        result,
      });
    } else {
      return res.status(202).json({
        result,
      });
    }
  });
});
// get User Subscription
router.get("/get-user-profile", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let sql = `Select first_name,last_name,email,profile from users WHERE user_guid = ${userGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get Route for getting assumptions
router.get("/get-assumptions/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);
  let sql = `Select * from assumptions WHERE property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get Route for Appartment Mix Data
router.get("/appartment-summary/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);

  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT properties.*,appartment_unit_mix.* from properties 
  LEFT JOIN appartment_unit_mix ON properties.property_guid = appartment_unit_mix.property_guid 
  WHERE properties.property_guid = ${propertyGuid}`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      console.log(data);

      let promiseTwo = new Promise((resolve, reject) => {
        let sql1 = `SELECT * from property_income WHERE property_guid = ${propertyGuid}`;
        let query = db.Query(sql1).then(({err, result:result1}) => {
          if (err) {
            return res.status(500).json({
              message: "Some Error Occured",
            });
          }
          data[0]["Incomes"] = result1;
          resolve(data);
        });
      });
      promiseTwo.then(
        (data) => {
          console.log(data);
          let promiseThree = new Promise((resolve, reject) => {
            let sql1 = `SELECT * from property_expenses WHERE property_guid = ${propertyGuid}`;
            let query = db.Query(sql1).then(({err, result:result1}) => {
              if (err) {
                return res.status(500).json({
                  message: "Some Error Occured",
                });
              }
              data[0]["Expenses"] = result1;
              resolve(data);
            });
          });
          promiseThree.then(
            (data) => {
              console.log(data);

              let promiseFour = new Promise((resolve, reject) => {
                let sql1 = `SELECT * from debts WHERE property_guid = ${propertyGuid}`;
                let query = db.Query(sql1).then(({err, result:result1}) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Some Error Occured",
                    });
                  }
                  data[0]["Debts"] = result1;
                  resolve(data);
                });
              });
              promiseFour.then(
                (result) => {
                  console.log(result);

                  return res.status(200).json({
                    result,
                  });
                },
                (error) => {
                  return res.status(500).json({
                    message: "Some Error Occured",
                  });
                }
              );
            },
            (error) => {
              return res.status(500).json({
                message: "Some Error Occured",
              });
            }
          );
        },
        (error) => {
          return res.status(500).json({
            message: "Some Error Occured",
          });
        }
      );
    },
    (error) => {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
  );
});

// Get Route for Summary Storage Details
router.get("/storage-summary/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);

  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT properties.*,storage_unit_mix.* from properties 
  LEFT JOIN storage_unit_mix ON properties.property_guid = storage_unit_mix.property_guid 
  WHERE properties.property_guid = ${propertyGuid}`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      console.log(data);

      let promiseTwo = new Promise((resolve, reject) => {
        let sql1 = `SELECT * from property_income WHERE property_guid = ${propertyGuid}`;
        let query = db.Query(sql1).then(({err, result:result1}) => {
          if (err) {
            return res.status(500).json({
              message: "Some Error Occured",
            });
          }
          data[0]["Incomes"] = result1;
          resolve(data);
        });
      });
      promiseTwo.then(
        (data) => {
          console.log(data);
          let promiseThree = new Promise((resolve, reject) => {
            let sql1 = `SELECT * from property_expenses WHERE property_guid = ${propertyGuid}`;
            let query = db.Query(sql1).then(({err, result:result1}) => {
              if (err) {
                return res.status(500).json({
                  message: "Some Error Occured",
                });
              }
              data[0]["Expenses"] = result1;
              resolve(data);
            });
          });
          promiseThree.then(
            (data) => {
              console.log(data);

              let promiseFour = new Promise((resolve, reject) => {
                let sql1 = `SELECT * from debts WHERE property_guid = ${propertyGuid}`;
                let query = db.Query(sql1).then(({err, result:result1}) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Some Error Occured",
                    });
                  }
                  data[0]["Debts"] = result1;
                  resolve(data);
                });
              });
              promiseFour.then(
                (data) => {
                  console.log(data);

                  let promiseFive = new Promise((resolve, reject) => {
                    let sql1 = `SELECT * from unit_mix WHERE property_guid = ${propertyGuid}`;
                    let query = db.Query(sql1).then(({err, result:result1}) => {
                      if (err) {
                        return res.status(500).json({
                          message: "Some Error Occured",
                        });
                      }
                      data[0]["Units"] = result1;
                      resolve(data);
                    });
                  });
                  promiseFive.then(
                    (result) => {
                      console.log(result);
                      return res.status(200).json({
                        result,
                      });
                    },
                    (error) => {
                      return res.status(500).json({
                        message: "Some Error Occured",
                      });
                    }
                  );
                },
                (error) => {
                  return res.status(500).json({
                    message: "Some Error Occured",
                  });
                }
              );
            },
            (error) => {
              return res.status(500).json({
                message: "Some Error Occured",
              });
            }
          );
        },
        (error) => {
          return res.status(500).json({
            message: "Some Error Occured",
          });
        }
      );
    },
    (error) => {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
  );
});

// Get Route for Appartment data
router.get("/appartment-data/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);
  let sql = `SELECT appartment_unit_mix.beds, properties.full_name, appartment_unit_mix.asking_price, appartment_unit_mix.baths, appartment_unit_mix.back_taxes from appartment_unit_mix 
  INNER JOIN properties ON properties.property_guid = appartment_unit_mix.property_guid 
  WHERE appartment_unit_mix.property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get Unit Mix Data
router.get("/get-unit/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);
  let sql = `Select * from unit_mix WHERE property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get Unit Mix Data
router.get("/get-apartment-mix-data/:id", checkAuth, (req, res) => {
  let propertyGuid = db.connection.escape(req.params.id);
  console.log(propertyGuid);
  let sql = `Select * from apartment_mix WHERE property_guid = ${propertyGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Get Single Unit Mix
router.get("/get-single-apartment-mix-data/:id", checkAuth, (req, res) => {
  let apartmentMixId = db.connection.escape(req.params.id);
  console.log(propertyGuid);
  let sql = `Select * from apartment_mix WHERE apartment_mix_guid = ${apartmentMixId}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// get Property
router.get("/get-property", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  console.log(userGuid);
  let sql = `SELECT * FROM properties where user_guid = ${userGuid} and is_deleted = '0'`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// ---------------------------------------------------
// Admin Routes
// Coupon List
router.get("/admin-coupon", checkAuth, (req, res) => {
  let sql = `SELECT * FROM coupons`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Users List
router.get("/admin-user", checkAuth, (req, res) => {
  let sql = `SELECT users.first_name, users.last_name, users.email as 'my_email',subscription_plans.price, users.profile, user_subscriptions.* FROM users 
  LEFT JOIN user_subscriptions ON users.user_guid = user_subscriptions.user_guid LEFT JOIN subscription_plans ON 
  subscription_plans.subscription_plan_id = user_subscriptions.subscription_plan_id where users.role<>'admin'`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

router.get("/admin-property", checkAuth, (req, res) => {
  let sql = `SELECT * FROM properties`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// Property List
// router.get("/admin-property",checkAuth, (req, res) => {
//   let promiseOne = new Promise((resolve, reject)=> {
//     let sql = `SELECT * FROM properties`;
//     let query = db.Query(sql).then(({err, result}) => {
//       if (err) {
//         return res.status(500).json({
//           message: "Some Error Occured",
//         });
//       }
//       resolve(result)
//     });
//   })
//   promiseOne.then(
//     (data) => {
//       let finalResult = [];
//       let promiseTwo = new Promise((resolve, reject)=> {
//         for (let i = 0; i < data.length; i++)
//         {
//           let sql = `SELECT properties.*, SUM(property_income.value) FROM properties Left JOIN property_income ON properties.property_guid = property_income.property_guid
//           WHERE properties.property_guid = ${db.connection.escape(data[i].property_guid)}`;
//           let query = db.Query(sql).then(({err, result}) => {
//             if (err) {
//               return res.status(500).json({
//                 message: "Some Error Occured",
//               });
//             }
//             // console.log(i)
//             finalResult.push(i)
//           });
//         }
//         resolve(finalResult)
//           // console.log(finalResult)
//       })
//       promiseTwo.then(
//         (data) => {
//           console.log(data.length)
//           return res.status(200).json({
//             data
//           })

//         },(error) => {
//           return res.status(500).json({
//             error
//           })
//         }
//       )
//     }, (error)=>{
//       return res.status(500).json({
//         error
//       })
//     }
//   )

// });

// Admin Home
router.get("/admin-home", checkAuth, (req, res) => {
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM properties LIMIT 3`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Some Error Occured",
        });
      }
      let data = {};
      data["properties"] = result;
      resolve(data);
    });
  });
  promiseOne.then(
    (data) => {
      console.log(data);

      let promiseTwo = new Promise((resolve, reject) => {
        let sql1 = `SELECT COUNT(*) as 'storage_count' FROM storage_unit_mix`;
        let query = db.Query(sql1).then(({err, result:result1}) => {
          if (err) {
            return res.status(500).json({
              message: "Some Error Occured",
            });
          }
          data["TotalUnits"] = result1;
          resolve(data);
        });
      });
      promiseTwo.then(
        (data) => {
          console.log(data);
          let promiseThree = new Promise((resolve, reject) => {
            let sql1 = `SELECT COUNT(*) as 'apartment_count' FROM appartment_unit_mix`;
            let query = db.Query(sql1).then(({err, result:result1}) => {
              if (err) {
                return res.status(500).json({
                  message: "Some Error Occured",
                });
              }
              data["TotalApartments"] = result1;
              resolve(data);
            });
          });
          promiseThree.then(
            (data) => {
              console.log(data);

              let promiseFour = new Promise((resolve, reject) => {
                let sql1 = `SELECT COUNT(*) as 'users' FROM users`;
                let query = db.Query(sql1).then(({err, result:result1}) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Some Error Occured",
                    });
                  }
                  data["users"] = result1;
                  resolve(data);
                });
              });
              promiseFour.then(
                (data) => {
                  let promiseFive = new Promise((resolve, reject) => {
                    let sql1 = `SELECT COUNT(*) as 'user_subscriptions' FROM user_subscriptions`;
                    let query = db.Query(sql1).then(({err, result:result1}) => {
                      if (err) {
                        return res.status(500).json({
                          message: "Some Error Occured",
                        });
                      }
                      data["usersSubscription"] = result1;
                      resolve(data);
                    });
                  });
                  promiseFive.then(
                    (data) => {
                      let promiseSix = new Promise((resolve, reject) => {
                        let sql1 = `SELECT COUNT(properties.property_guid) as 'property',COUNT(appartment_unit_mix.property_guid) as 'apartment'
                  ,COUNT(storage_unit_mix.property_guid) as 'unit', MONTH(properties.dateCreated) as 'month' 
                  FROM properties 
                  LEFT JOIN appartment_unit_mix ON properties.property_guid = appartment_unit_mix.property_guid
                   LEFT JOIN storage_unit_mix ON properties.property_guid = storage_unit_mix.property_guid 
                  GROUP by MONTH(properties.dateCreated)`;
                        let query = db.Query(sql1).then(({err, result:result1}) => {
                          if (err) {
                            return res.status(500).json({
                              message: "Some Error Occured",
                            });
                          }
                          data["GraphMonth"] = result1;
                          resolve(data);
                        });
                      });
                      promiseSix.then(
                        (result) => {
                          return res.status(200).json({
                            result,
                          });
                        },
                        (error) => {
                          return res.status(500).json({
                            message: "Some Error Occured",
                          });
                        }
                      );
                    },
                    (error) => {
                      return res.status(500).json({
                        message: "Some Error Occured",
                      });
                    }
                  );
                },
                (error) => {
                  return res.status(500).json({
                    message: "Some Error Occured",
                  });
                }
              );
            },
            (error) => {
              return res.status(500).json({
                message: "Some Error Occured",
              });
            }
          );
        },
        (error) => {
          return res.status(500).json({
            message: "Some Error Occured",
          });
        }
      );
    },
    (error) => {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
  );
});

// Route to get subscription plans
router.get("/admin-plans", checkAuth, (req, res) => {
  let sql = `SELECT * FROM subscription_plans`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});
// ---------------------------------------------------
// ------------------------------------------------------

//get single user
router.get("/getAdmin", checkAuth, (req, res) => {
  let sql = `SELECT * FROM tbl_admin where AdminGuid = ${db.connection.escape(
    req.userData.AdminGuid
  )} AND IsDeleted='0'`;

  let query = db.Query(sql).then(({err, result:results}) => {
    if (err) throw err;
    console.log(results);
    res.send(results);
    return;
  });
});

//get single user
router.get("/getEmployees", checkAuth, (req, res) => {
  let sql = `SELECT * FROM tbl_users as u INNER JOIN tbl_contacts as c ON c.UserGuid = u.UserGuid INNER JOIN tbl_emails as e ON e.UserGuid= u.UserGuid LEFT JOIN tbl_vaccines as v ON u.UserGuid = v.UserGuid WHERE u.IsDeleted='0' AND c.IsDeleted='0' AND e.IsDeleted='0' AND e.IsDefault='1' AND c.IsDefault='1';`;

  let query = db.Query(sql).then(({err, result:results}) => {
    if (err) throw err;
    console.log(results);
    res.send(results);
    return;
  });
});

module.exports = router;
