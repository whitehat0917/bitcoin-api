var Client = require('bitcore-wallet-client');
var requestIp = require('request-ip');
var md5 = require('md5');

//var base32 = require('base32');

//var Bitcore = require('bitcore-lib');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var fs = require('fs');
var BWS_INSTANCE_URL = 'http://localhost:3232/bws/api';
//var BWS_INSTANCE_URL = 'https://bws.bitpay.com/bws/api';

var client = new Client({
    baseUrl: BWS_INSTANCE_URL,
    verbose: true
});
app.use(bodyParser.json());

var secret = "mywalletsecret@gmble*321@";

app.post('/create_wallet', function(req, res) {
    var data;
    console.log(req.body);

    client.createWallet(req.body.wallet_name, req.body.username, 1, 1, { network: 'testnet' }, function(err, secret) {
        if (err) {
            data = {
                    'error': err
                }
                //console.log('\nReturn:', addr)
            res.status(200).send(data);
            console.log('error: ', err);
            return
        };
        data = {
            //secret: secret  No secret for 1:1 wallet
            'msg': 'wallet created successfully secret' + secret
        };
        fs.writeFileSync('wallet.dat', client.export());
        res.status(200).send(data);
        //res.send('Wallet Created. Share this secret with your copayers: ' + secret);
    });
});

/*app.post('/join_wallet', function(req, res) {
    //var secret = req.body.secret;
	var data;
	
	var client = new Client({
	  baseUrl: BWS_INSTANCE_URL,
	  verbose: false,
	});
	
    client.joinWallet(secret, req.body.username, {network: 'testnet'}, function(err, wallet) {
        if (err) {
            data = {
                    error: err
                }
                //console.log('\nReturn:', addr)
            res.status(200).send(data);
            console.log('error: ', err);
            return;
        }
        fs.writeFileSync('joinwallet.dat', client.export());
		data = {
			msg: "joined wallet"
		}
		res.status(200).send(data);
    });
})*/

app.post('/createAddress', function(req, res) {
    var data = '';

    fs.readFile('./wallet.dat', function read(err, data) {
        if (err) {
            data = {
                'status': false,
                'msg': null,
                'data': err
            };
            res.status(200).send(data);
            return;
        }
        client.import(data);

        client.openWallet(function(err, ret) {
            if (err) {
                console.log('error: ', err);
                data = {
                    'status': false,
                    'msg': null,
                    'data': err
                };
                res.status(200).send(data);
                return
            };
            console.log('\n\n** Wallet Info', ret); //TODO

            //console.log('\n\nCreating address:', ret); //TODO
            //if (ret.wallet.status == 'complete') {

            if (ret == true) {
                client.createAddress({}, function(err, addr) {
                    if (err) {
                        console.log('error: ', err);
                        return;
                    };

                    console.log('\nReturn:', addr);
                    data = {
                        'status': true,
                        'msg': 'address generated successfully',
                        'data': addr
                    };
                    res.status(200).send(data);
                });
            }
        });
    });
})

app.post('/getAddresses', function(req, res) {
    var data = '';
    fs.readFile('./wallet.dat', function read(err, data1) {
        if (err) {
            data = {
                'status': false,
                'msg': null,
                'data': err
            };
            res.status(200).send(data);
            return;
        }
        client.import(data1);

        client.openWallet(function(err, ret) {
            if (err) {
                console.log('error: ', err);
                data = {
                    'status': false,
                    'msg': null,
                    'data': err
                };
                res.status(200).send(data);
                return;
            };

            if (ret == true) {
                client.getMainAddresses({}, function(err, addresses) {
                    if (err) {
                        data = {
                            'status': false,
                            'msg': null,
                            'data': err
                        };
                        res.status(200).send(data);
                        return;
                    };
                    //console.log(addresses);
                    data = {
                        'status': true,
                        'msg': null,
                        'data': addresses
                    };
                    res.status(200).send(data);
                });
            }
        });
    });
});

app.post('/getBalance', function(req, res) {
    var data = '';
    fs.readFile('./wallet.dat', function read(err, data1) {
        if (err) {
            data = {
                'status': false,
                'msg': null,
                'data': err
            };
            res.status(200).send(data);
            return;
        }
        client.import(data1);

        client.openWallet(function(err, ret) {
            if (err) {
                console.log('error: ', err);
                data = {
                    'status': false,
                    'msg': null,
                    'data': err
                };
                res.status(200).send(data);
                return;
            };

            if (ret == true) {
                client.getBalance({}, function(err, balance) {
                    if (err) {
                        data = {
                            'status': false,
                            'msg': null,
                            'data': err
                        };
                        res.status(200).send(data);
                        return;
                    };
                    //console.log(balance);
                    data = {
                        'status': true,
                        'msg': null,
                        'data': balance
                    };
                    res.status(200).send(data);
                });
            }
        });
    });
});

app.post('/createTxproposal', function(req, res) {
    //const BigNumber = require('bignumber.js');
    //var amount = new BigNumber(req.body.amount);
    var forEach = require('async-foreach').forEach;
    var data = '';

    var amount = req.body.amount * 100000000;
    var toAddress = req.body.toAddress;
    // var fromAddress = req.body.fromAddress;
    //var msg = req.body.msg;
    //var changeAddress = req.body.changeAddress;

    amount = Math.round(amount);
    //amount = amount.multipliedBy(100000000);
    //amount = amount.toFixed();
    var clientIp = requestIp.getClientIp(req);
    console.log(clientIp);
    console.log(md5(secret));

    if ((md5(secret) != req.body.secret)) {
        data = {
            'status': false,
            'msg': "Invalid Secret",
            'data': null
        };
        res.status(200).send(data);
        return;
    }

    //read the wallet file
    fs.readFile('./wallet.dat', function read(err, data1) {
        if (err) {
            data = {
                'status': false,
                'msg': null,
                'data': err
            };
            res.status(200).send(data);
            return;
        }
        client.import(data1);

        client.openWallet(function(err, ret) {
            if (err) {
                console.log('error: ', err);
                data = {
                    'status': false,
                    'msg': 'some error occurred',
                    'data': err
                };
                res.status(200).send(data);
                return;
            };
            //console.log('\n\n** Wallet Info', ret); //TODO

            //console.log('\n\nCreating address:', ret); //TODO
            if (ret == true) {

                //get utxos
                client.getUtxos({}, function(err, utxos) {
                    if (err) {
                        data = {
                            'status': false,
                            'msg': null,
                            'data': err
                        };
                        res.status(200).send(data);
                        return;
                    };

                    //make utxos for fromAddress
                    // var utxos1 = [];
                    // forEach(utxos, function(item, index) {
                    //     // Only when `this.async` is called does iteration becomes asynchronous. The
                    //     // loop won't be continued until the `done` function is executed.
                    //     var done = this.async();

                    //     if (item.address == fromAddress) {
                    //         utxos1.push(item);
                    //         done();
                    //     }
                    // });

                    //console.log(utxos);
                    // console.log(utxos1);
                    //return;
                    var opts = {
                        inputs: utxos,
                        outputs: [{
                            amount: amount,
                            toAddress: toAddress,
                            //message: 'Create a transaction proposal'
                        }],
                        feePerKb: 10000,
                        excludeUnconfirmedUtxos: false,
                        //utxosToExclude: utxos1,
                        // changeAddress: fromAddress
                    };
                    //console.log(opts);

                    //create txproposal
                    client.createTxProposal(opts, function(err, txp) {
                        if (err) {
                            console.log(err);
                            data = {
                                'status': false,
                                'msg': 'some error occurred',
                                'data': err
                            };
                            res.status(200).send(data);
                            return;
                        };
                        console.log(txp);
                        client.publishTxProposal({ txp: txp }, function(err) {
                            if (err) {
                                data = {
                                    'status': true,
                                    'msg': 'Error in publishTxProposal',
                                    'data': err
                                };
                                res.status(200).send(data);
                                return;
                            };

                            //get all transaction proposals
                            client.getTxProposals({}, function(err, txps) {
                                if (err) {
                                    data = {
                                        'status': false,
                                        'msg': "Error to get transaction proposal",
                                        'data': err
                                    };
                                    res.status(200).send(data);
                                    return;
                                };

                                console.log(txps[0]);
                                //sign transaction proposal
                                client.signTxProposal(txps[0], function(err, stxp1) {
                                    if (err) {
                                        console.log(err);
                                        data = {
                                            'status': false,
                                            'msg': "Error to sign transaction proposal",
                                            'data': err
                                        };
                                        res.status(200).send(data);
                                        return;
                                    };
                                    //broadcast transaction proposal 
                                    client.broadcastTxProposal(stxp1, function(err, txob) {
                                        if (err) {
                                            console.log(err);
                                            data = {
                                                'status': false,
                                                'msg': "Error to broadcast transaction",
                                                'data': err
                                            };
                                            res.status(200).send(data);
                                            return;
                                        };
                                        //console.log(balance);
                                        data = {
                                            'status': true,
                                            'msg': "transaction Successful",
                                            'data': txob
                                        };
                                        res.status(200).send(data);
                                    }); // broadcastTxProposal

                                }); // sign 1

                            }); // getTxProposals

                        }); //publish txproposal end

                    }); //create txproposal end

                }); //get utxos end
            }
        }); //open wallet end
    }); //read file

});

app.post('/getTxHistory', function(req, res) {
    var data = '';
    fs.readFile('./wallet.dat', function read(err, data1) {
        if (err) {
            data = {
                'status': false,
                'msg': null,
                'data': err
            };
            res.status(200).send(data);
            return;
        }
        client.import(data1);

        client.openWallet(function(err, ret) {
            if (err) {
                console.log('error: ', err);
                data = {
                    'status': false,
                    'msg': null,
                    'data': err
                };
                res.status(200).send(data);
                return;
            };

            if (ret == true) {
                client.getTxHistory({ limit: 100 }, function(err, txps) {
                    if (err) {
                        data = {
                            'status': false,
                            'msg': null,
                            'data': err
                        };
                        res.status(200).send(data);
                        return;
                    };
                    //console.log(balance);
                    data = {
                        'status': true,
                        'msg': null,
                        'data': txps
                    };
                    res.status(200).send(data);
                });
            }
        });
    });
});

/*app.post('/signTxProposal', function(req, res) {
	var data = '';
	var txp = req.body.txp;
	fs.readFile('./wallet.dat', function read(err, data1) {
		if (err) {
			data = {
				'status': false,
				'msg': null,
				'data': err
			};
			res.status(200).send(data);
			return;
		}
		client.import(data1);
		
		client.openWallet(function(err, ret) {
			if (err) {
				console.log('error: ', err);
				data = {
					'status': false,
					'msg': null,
					'data': err
				};
				res.status(200).send(data);
				return;
			};
			
			if(ret == true) {
			 client.signTxProposal(txp, function(err, stxp) {
				if (err) {
					data = {
						'status': false,
						'msg': null,
						'data': err
					};
					res.status(200).send(data);
					return;
				};
				//console.log(stxp);
					data = {
						'status': true,
						'msg': null,
						'data': stxp
					};
					res.status(200).send(data);
			 });
		  }
	    });  
	});
});

app.post('/broadcastTxProposal', function(req, res) {
	var data = '';
	var signedTxp = req.body.signedTxp;
	console.log(signedTxp);
	fs.readFile('./wallet.dat', function read(err, data1) {
		if (err) {
			data = {
				'status': false,
				'msg': null,
				'data': err
			};
			res.status(200).send(data);
			return;
		}
		client.import(data1);
		
		client.openWallet(function(err, ret) {
			if (err) {
				console.log('error: ', err);
				data = {
					'status': false,
					'msg': null,
					'data': err
				};
				res.status(200).send(data);
				return;
			};
			
			if(ret == true) {
			 client.getTxProposals({}, function(err, txps) {
				if (err) {
					data = {
						'status': false,
						'msg': "Error to get transaction proposal",
						'data': err
					};
					res.status(200).send(data);
					return;
				};
				client.signTxProposal(txps[0], function(err, stxp1) {
				 if (err) {
					data = {
						'status': false,
						'msg': "Error to sign transaction proposal",
						'data': err
					};
					res.status(200).send(data);
					return;
				 };
					 
						client.broadcastTxProposal(stxp1, function(err, txob) {
							if (err) {
								data = {
									'status': false,
									'msg': "Error to broadcast transaction",
									'data': err
								};
								res.status(200).send(data);
								return;
							};
							//console.log(balance);
							data = {
								'status': true,
								'msg': "transaction Successfull",
								'data': txob
							};
							res.status(200).send(data);
						}); // broadcastTxProposal
				}); // sign 1
				
			 }); // getTxProposals
		  }
	    });  //open wallet
	});
});

app.post('/broadcastRawTx', function(req, res) {
	var data = '';
	var rawTx = req.body.rawTx;
	console.log(rawTx);
	fs.readFile('./wallet.dat', function read(err, data1) {
		if (err) {
			data = {
				'status': false,
				'msg': null,
				'data': err
			};
			res.status(200).send(data);
			return;
		}
		client.import(data1);
		
		client.openWallet(function(err, ret) {
			if (err) {
				console.log('error: ', err);
				data = {
					'status': false,
					'msg': null,
					'data': err
				};
				res.status(200).send(data);
				return;
			};
			
			if(ret == true) {
			 var opts = {
				 network: 'testnet',
				 rawTx: rawTx
			 }
			 client.broadcastRawTx(opts, function(err, txob) {
						if (err) {
							data = {
								'status': false,
								'msg': "Error to broadcast row transaction",
								'data': err
							};
							res.status(200).send(data);
							return;
						};
						//console.log(balance);
						data = {
							'status': true,
							'msg': "transaction Successfull",
							'data': txob
						};
						res.status(200).send(data);
			}); // broadcastTxProposal
		  }
	    });  //open wallet
	});
});

app.post('/removeTxProposal', function(req, res) {
	var data = '';
	var Txno = null;
	var Txno = req.body.Txno;
	if(Txno == null){
		Txno = 0;
	}
	
	fs.readFile('./wallet.dat', function read(err, data1) {
		if (err) {
			data = {
				'status': false,
				'msg': null,
				'data': err
			};
			res.status(200).send(data);
			return;
		}
		client.import(data1);
		
		client.openWallet(function(err, ret) {
			if (err) {
				console.log('error: ', err);
				data = {
					'status': false,
					'msg': null,
					'data': err
				};
				res.status(200).send(data);
				return;
			};
			console.log(Txno);
			if(ret == true) {
				
				client.getTxProposals({}, function(err, txps) {
					if (err) {
						data = {
							'status': false,
							'msg': "Error to get transaction proposal",
							'data': err
						};
						res.status(200).send(data);
						return;
					};
					client.removeTxProposal( txps[Txno], function(err) {
						if (err) {
							data = {
								'status': false,
								'msg': "some error in removeTxProposal",
								'data': err
							};
							res.status(200).send(data);
							return;
						};
						
						data = {
							'status': true,
							'msg': "Transaction Proposal Removed",
							'data': null
						};
						res.status(200).send(data);
				 });
			}); // get transaction proposal	 
		  }
	    });  
	});
});*/

var server = app.listen(80, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})