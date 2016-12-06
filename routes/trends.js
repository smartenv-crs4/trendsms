var express = require('express');
var router = express.Router();
// var Joi = require('joi'); // Validation
var Trend = require('../models/trends').Trend; // Mongoose ODM
var _ = require('underscore')._;


var au = require('audoku');


/* GET trends listing. */
router.get('/trends',au.doku({
    description: 'Get all the trends',
    title: 'Get trends',
    version: '1.0.0',
    name: 'GetTrends',
    group: 'Trends',
    fields: {
        page: {
            description: 'The current page for pagination',
            type: 'integer', required: false
        },
        limit: {
            description: 'The current limit for pagination',
            type: 'integer', required: false
        }
    }
}), function (request, res) {
    var query = _.extend({}, request.query);
    if ("dateFrom" in request.query || "dateTo" in request.query) {
        var from = request.query.dateFrom;
        var to = request.query.dateTo;

        query['createdAt'] = {};
        if (from) {
            delete query['dateFrom'];
            query['createdAt']['$gte'] = from;
        }
        if (to) {
            delete query['dateTo'];
            query['createdAt']['$lte'] = to;
        }

    }
    delete query.skip;
    delete query.limit;
    delete query.offset;
    delete query.page;


    Trend.paginate(query, {page: request.query.page, limit: request.query.limit}).then(function (results) {
        if (_.isEmpty(results))
            res.boom.notFound("Not found elements for query " + JSON.stringify(query));
        else
            res.send(results);  // HTTP 200 ok
    }).catch(function (err) {
        res.boom.badImplementation(err); // 500 error
    });
});


router.post('/trends',au.doku({
    description: 'Create new trend',
    title: 'Post trends',
    version: '1.0.0',
    name: 'PostTrend',
    group: 'Trends',
    fields: {
        createdAt: {
            description: 'The date of the search',
            type: 'date', required: false
        },
        idCustomer: {
            description: 'The customer id',
            type: 'integer', required: true
        },
        category: {
            description: 'The category identifier',
            type: 'string', required: true
        },
        keyword: {
            description: 'The search keywords/keyphrase',
            type: 'string', required: true
        },
        results: {
            description: 'The number of results',
            type: 'integer', required: true
        }
    }
}), function (request, res) {

    var trend = new Trend();
    trend.createdAt = request.payload.createdAt;
    trend.idCustomer = request.payload.idCustomer;
    trend.category = request.payload.category;
    trend.keyword = request.payload.keyword;
    trend.results = request.payload.results;

    trend.save().then(function (trend) {
        res.status(201).send('/api/trends/' + trend._id); // HTTP 201 created
    }).catch(function (err) {
        res.boom.forbidden(getErrorMessageFrom(err)); // HTTP 403
    });
});

router.delete('/trends', function (request, res) {
    Trend.findByIdAndRemove(request.params.id).then(function (trend) {
        res.send({
            message: "Trend deleted successfully"
        });  // HTTP 200 ok
    }).catch(function (err) {
        res.boom.notFound();   // Error 404
    });
});

//
//TRENDS STATISTICS
//


router.get('/trends/mostwanted',au.doku({
    description: 'Get the stats about most searched keywords/keyphrase',
    title: 'Get most wanted',
    version: '1.0.0',
    name: 'GetMostWanted',
    group: 'Trends',
    fields: {
        page: {
            description: 'The current page for pagination',
            type: 'integer', required: false
        },
        limit: {
            description: 'The current limit for pagination',
            type: 'integer', required: false
        }
    }
}), function (request, res) {
    Trend.aggregate([{
        "$group": {
            _id: "$keyword",
            count: {"$sum": 1},
            results: {$min: "$results"},
            fromDate: {$min: "$createdAt"},
            toDate: {$max: "$createdAt"}
        }
    }, {$sort: {count: -1}}, {$limit: request.query.limit}]).then(function (result) {
        res.send(result);      // HTTP 200 ok
    }).catch(function (err) {
        res.boom.badImplementation(err); // 500 error;
    });
});


router.get('/trends/mostfound',au.doku({
    description: 'Get the stats about keywords/keyphrase having more results',
    title: 'Get most found',
    version: '1.0.0',
    name: 'GetMostFound',
    group: 'Trends',
    fields: {
        dateFrom: {
            description: 'Start date interval',
            type: 'integer', required: false
        },
        dateTo: {
            description: 'End date interval',
            type: 'integer', required: false
        },
        page: {
            description: 'The current page for pagination',
            type: 'integer', required: false
        },
        limit: {
            description: 'The current limit for pagination',
            type: 'integer', required: false
        }
    }
}), function (request, res) {
    Trend.aggregate([{
        "$group": {
            _id: "$keyword",
            count: {"$sum": 1},
            results: {$min: "$results"},
            fromDate: {$min: "$createdAt"},
            toDate: {$max: "$createdAt"}
        }
    }, {$sort: {results: -1}}, {$skip: (request.query.page - 1) * request.query.limit}, {$limit: request.query.limit}]).then(function (result) {
        res.send(result);      // HTTP 200 ok
    }).catch(function (err, results) {
        res.boom.badImplementation(err); // 500 error;

    });
});


router.get('/trends/rare',au.doku({
    description: 'Get the stats about keywords/keyphrase having less results',
    title: 'Get less found',
    version: '1.0.0',
    name: 'GetLessFound',
    group: 'Trends',
    fields: {
        page: {
            description: 'The current page for pagination',
            type: 'integer', required: false
        },
        limit: {
            description: 'The current limit for pagination',
            type: 'integer', required: false
        }
    }
}), function (request, res) {
    Trend.aggregate([{
        "$group": {
            _id: "$keyword",
            count: {"$sum": 1},
            results: {$min: "$results"}
        }
    }, {
        $sort: {
            count: 1,
            results: 1
        }
    }, {$skip: (request.query.page - 1) * request.query.limit}, {$limit: request.query.limit}]).then(function (results) {
        res.send(results);   // HTTP 200 ok
    }).catch(function (err) {
        return res.boom.badImplementation(err); // 500 error;
    });
});


router.get('/trends/notfound',au.doku({
    description: 'Get the stats about keywords/keyphrase having no results',
    title: 'Get not found',
    version: '1.0.0',
    name: 'GetNotFound',
    group: 'Trends',
    fields: {
        page: {
            description: 'The current page for pagination',
            type: 'integer', required: false
        },
        limit: {
            description: 'The current limit for pagination',
            type: 'integer', required: false
        }
    }
}), function (request, res) {
    Trend.aggregate([{$match: {results: {$lt: 1}}}, {
        "$group": {
            _id: "$keyword",
            results: {$sum: "$results"},
            count: {$sum: 1},
            fromDate: {$min: "$createdAt"},
            toDate: {$max: "$createdAt"}
        }
    }, {$sort: {count: -1}}, {$skip: (request.query.page - 1) * request.query.limit}, {$limit: request.query.limit}]).then(function (results) {
        res.send(results);  // HTTP 200 ok
    }).catch(function (err) {
        return res.boom.badImplementation(err); // 500 error;
    });
});





/**
 * Formats an error message that is returned from Mongoose.
 *
 * @param err The error object
 * @returns {string} The error message string.
 */
function getErrorMessageFrom(err) {
    var errorMessage = '';

    if (err.errors) {
        for (var prop in err.errors) {
            if (err.errors.hasOwnProperty(prop)) {
                errorMessage += err.errors[prop].message + ' '
            }
        }

    } else {
        errorMessage = err.message;
    }

    return errorMessage;
}

module.exports = router;
