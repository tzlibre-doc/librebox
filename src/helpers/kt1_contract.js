var managerOps = {
  transfer : function(destination, amount, endpoint, parameters){
    if (destination.substr(0,2) == "KT") {
      if (typeof endpoint == 'undefined') endpoint = 'default';
      if (typeof parameters == 'undefined') parameters = 'Unit';
      if (parameters == 'Unit') parameters = false;

      if (!parameters){
        var contract = [{"prim": "unit"}];
        var params = {"prim": "UNIT"};
      } else {
        throw "WIP";
      //var contract = [{"prim": },{"prim": }];
      //var params = {"prim": "UNIT"};                      
      }
      var param = [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "PUSH", "args": [{"prim": "address"},{"string": destination}]},
      {"prim": "CONTRACT", "args": contract},
      {"prim": "ASSERT_SOME"},
      {"prim": "PUSH", "args": [{"prim": "mutez"},{"int": eztz.utility.mutez(amount)}]},
      params,
      {"prim": "TRANSFER_TOKENS"},
      {"prim": "CONS"}
      ];
    } else {
      var param = [
       {"prim": "DROP"},
       {"prim": "NIL", "args": [{"prim": "operation"}]},
       {"prim": "PUSH", "args": [{"prim": "key_hash"},{"string": destination}]},
       {"prim": "IMPLICIT_ACCOUNT"},
       {"prim": "PUSH", "args": [{"prim": "mutez"},{"int": eztz.utility.mutez(amount)}]},
       {"prim": "UNIT"},
       {"prim": "TRANSFER_TOKENS"},
       {"prim": "CONS"}
      ];
    }
    return ['do', param];
  },
  delegate : function(delegate){
    return ['do', [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "PUSH", "args": [{"prim": "key_hash"}, {"string": delegate}]},
      {"prim": "SOME"},
      {"prim": "SET_DELEGATE"},
      {"prim": "CONS"}
    ]];
  },
  undelegate : function(){
    return ['do', [
      {"prim": "DROP"},
      {"prim": "NIL", "args": [{"prim": "operation"}]},
      {"prim": "NONE", "args": [{"prim": "key_hash"}]},
      {"prim": "SET_DELEGATE"},
      {"prim": "CONS"}
    ]];
  }
}

module.exports = { managerOps };
