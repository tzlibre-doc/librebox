import config from '../config/config'
import popup from '../helpers/popup'

export default ['$scope', '$location', '$http', 'Storage', 'SweetAlert', 'tzLibreApi', 'angularEztz', function($scope, $location, $http, Storage, SweetAlert, tzLibreApi, angularEztz) {

  $scope.setting = {
    rpc: config.tzlibre.rpc,
    explorer: config.tzlibre.explorer,
    apiExplorer: config.tzlibre.apiExplorer
  }

  const { tzLibreAddress } = config
  const ss = Storage.loadStore()
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  }
  if (typeof ss.temp !== 'undefined') delete ss.temp
  if (!Storage.isLogged()) {
    $location.path('/unlock')
  }
  $scope.type = 'encrypted'
  if (ss.link) $scope.type = 'ledger'
  $scope.setting = Storage.loadSetting()
  window.eztzl.node.setProvider($scope.setting.rpc)
  $scope.accounts = ss.accounts
  $scope.account = ss.account
  $http.get(`${$scope.setting.apiExplorer}/tables/account?manager=${$scope.accounts[0].address}&limit=100&columns=address`)
    .then(r => r.data)
    .then(kt1s => kt1s.map(r => r[0]))
    .then(function(kt1s) {
      const newAccounts = kt1s
        .filter(address => $scope.accounts.filter(a => a.address === address).length === 0)
      if (newAccounts.length > 0) {
        SweetAlert.swal({
          title: 'Import KT addresses',
          text: 'We have found ' + newAccounts.length + ' KT1 address(es) linked to your public key - would you like to import them now? (You can also manually import these by going to Options > Import)',
          type: 'info',
          showCancelButton: true,
          confirmButtonText: 'Yes, import them!',
          closeOnConfirm: true
        }).then(isConfirm => {
          if (isConfirm) {
            const indexFrom = $scope.accounts.length
            for (let i = 0; i < newAccounts.length; i++) {
              $scope.accounts.push(
                {
                  title: 'Account ' + (indexFrom + i),
                  address: newAccounts[i],
                  chain: config.TZLIBRE
                }
              )
            }
            ss.accounts = $scope.accounts
            Storage.setStore(ss)
            $scope.refresh()
          }
          popup.hideLoader()
        })
      }
    })
  $scope.accountDetails = {}
  $scope.transactions = []
  $scope.accountLive = true
  $scope.tt = $scope.accounts[$scope.account].title
  $scope.amount = 0
  $scope.amount_to_deposit = 0
  $scope.fee = config.txFee
  $scope.parameters = ''
  $scope.delegateType = 'n/a'
  $scope.dd = ''
  $scope.block = {
    net: 'Loading..',
    level: 'N/A',
    proto: 'Loading'
  }
  $scope.transactions = []
  $scope.toDate = function(d) {
    const myDate = new Date(d)
    const date = myDate.getDate()
    const month = myDate.getMonth()
    const year = myDate.getFullYear()
    const hours = myDate.getHours()
    const minutes = myDate.getMinutes()
    function pad(n) {
      return n < 10 ? '0' + n : n
    }
    return pad(date) + '-' + pad(month + 1) + '-' + year + ' ' + pad(hours) + ':' + pad(minutes)
  }
  $scope.toTez = function(m) {
    return window.eztzl.utility.totez(parseInt(m))
  }
  const refreshTransactions = function() {
    Promise.all([
      $http.get(`${$scope.setting.apiExplorer}/tables/op?type=transaction&is_success=true&sender=${$scope.accounts[0].address}&columns=sender,receiver,volume,hash,time`),
      $http.get(`${$scope.setting.apiExplorer}/tables/op?type=transaction&is_success=true&receiver=${$scope.accounts[0].address}&columns=sender,receiver,volume,hash,time`)
    ]).then(function([dataReceivedTxs, dataSentTxs]) {
      const received = dataReceivedTxs.data
      const sent = dataSentTxs.data
      return [
        ...received,
        ...sent
      ].sort((a, b) => b.time - a.time)
    }).then(function (transactions) {
      transactions = transactions.map(([ source, destination, amount, hash, time ]) => {
        return {
          source,
          destination,
          time,
          hash,
          amount: amount*10**6
        }
      })
      $scope.$evalAsync(function() {
        $scope.transactions = transactions;
      })
    })
  }
  const refreshHash = function() {
    window.eztzl.rpc.getHead().then(function(r) {
      $scope.$apply(function() {
        $scope.block = {
          net: r.chain_id,
          level: r.header.level,
          proto: 'Connected to ' + r.protocol.slice(0, 6) + '... Proto_00' + r.header.proto
        }
      })
    }).catch(function(e) {
      $scope.$apply(function() {
        $scope.block = {
          net: 'Error',
          level: 'N/A',
          proto: 'Not Connected'
        }
      })
    })
  }
  refreshHash()
  refreshTransactions()
  const refreshAll = function() {
    refreshHash()
    refreshTransactions()
  }
  refreshAll();
  const ct = setInterval(refreshAll, 20000)
  $scope.viewSettings = function() {
    clearInterval(ct)
    $location.path('/setting')
  }
  $scope.lock = function() {
    clearInterval(ct)
    Storage.logged = false
    $location.path('/unlock')
  }
  $scope.delegate = function() {
    if (!$scope.dd || $scope.dd === '') {
      SweetAlert.swal('Uh-oh!', 'Please enter a delegate address')
      return
    }
    const type = $scope.type
    const address = $scope.accounts[$scope.account].address
    return angularEztz.delegate(type, address, $scope.dd)
  }
  $scope.saveTitle = function() {
    if (!$scope.tt) {
      SweetAlert.swal('Uh-oh!', 'Please enter a new title')
      return
    }
    $scope.accounts[$scope.account].title = $scope.tt
    ss.accounts = $scope.accounts
    Storage.setStore(ss)
    $scope.refresh()
  }
  $scope.kt1 = ''
  $scope.import = function() {
    if (!$scope.kt1) return SweetAlert.swal('Uh-oh!', 'Please enter the KT1 address to import')
    for (let i = 0; i < $scope.accounts.length; i++) {
      if ($scope.accounts[i].address === $scope.kt1) return SweetAlert.swal('Uh-oh!', 'That address is already linked to your wallet!')
    }
    popup.showLoader()

    window.eztzl.node.query('/chains/main/blocks/head/context/contracts/' + $scope.kt1 + '/manager').then(function(r) {
      if (r !== $scope.accounts[0].address) return SweetAlert.swal('Uh-oh!', 'That contract is not managed by your account key')
      $scope.$apply(function() {
        $scope.accounts.push(
          {
            title: 'Account ' + ($scope.accounts.length),
            address: $scope.kt1,
            chain: config.TZLIBRE
          }
        )
        $scope.account = ($scope.accounts.length - 1)
        ss.accounts = $scope.accounts
        ss.account = $scope.account
        Storage.setStore(ss)
        $scope.refresh()
        $scope.kt1 = ''
        popup.hideLoader()
      })
    }).catch(function(r) {
      popup.hideLoader()
      SweetAlert.swal('Uh-oh!', 'There was an error importing that account')
    })
  }
  $scope.add_kt1_on_tzl = async function() {
    const type = $scope.type
    const address = await angularEztz.originOnTzl(type)
    $scope.$apply(function() {
      if ($scope.accounts[$scope.accounts.length - 1].address !== address) {
        $scope.accounts.push({ title: 'Account ' + ($scope.accounts.length), address, chain: config.TZLIBRE })
        $scope.account = ($scope.accounts.length - 1)
        ss.accounts = $scope.accounts
        ss.account = $scope.account
        Storage.setStore(ss)
      } else {
        SweetAlert.swal('Uh-oh!', 'Error: awaiting existing origination to activate')
      }
      $scope.refresh()
      popup.hideLoader()
    })
  }
  $scope.delegates = {
    keys: [
      'false',
      tzLibreAddress
    ],
    names: [
      'Undelegated',
      'TzLibre'
    ]
  }
  $scope.loadAccount = function(a) {
    $scope.account = a
    $scope.transactions = []
    ss.account = $scope.account
    $scope.tt = $scope.accounts[$scope.account].title
    Storage.setStore(ss)
    $scope.accountDetails = {
      balance: 'n/a',
      tzl_balance: 'n/a',
      is_withdrawable: false,
      is_depositable: false,
      usd: 'Loading...',
      raw_balance: 'Loading...',
      loaded: false
    }
    if (a) {
      window.eztzl.rpc.getDelegate($scope.accounts[a].address).then(function(r) {
        $scope.$apply(function() {
          $scope.dd = r
          const ii = $scope.delegates.keys.indexOf($scope.dd)
          if (ii >= 0) {
            $scope.delegateType = $scope.dd
          } else { $scope.delegateType = '' }
        })
      })
    }
    tzLibreApi.isVerified($scope.accounts[0].address)
      .then(function({ verified, ethereumAddress }) {
        $scope.$evalAsync(function() {
          $scope.ethereumAddress = ethereumAddress
        })
        if (ethereumAddress) {
          return tzLibreApi.getTzlBalanceByEthAddress(ethereumAddress)
        }
        return 0
      })
      .then(function (tzlBalance) {
        $scope.$evalAsync(function() {
          $scope.accountDetails.tzl_balance = tzlBalance
        })
      })

    refreshTransactions()

    window.eztzl.rpc.getBalance($scope.accounts[a].address).then(function(r) {
      $scope.$apply(function() {
        $scope.accountLive = true
        const rb = parseInt(r)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztzl.utility.formatMoney(bal, 2, '.', ',') + ' TZL'
        $scope.accountDetails.usd = '$' + window.eztzl.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
        $scope.accountDetails.is_depositable = bal >= 1000
        $scope.amount_to_deposit = $scope.accountDetails.is_depositable ? Math.ceil((bal - 2) * 100) / 100 : 0
        $scope.accountDetails.loaded = true
      })
    }).catch(function(e) {
      $scope.$apply(function() {
        $scope.accountLive = false
        const rb = parseInt(0)
        const bal = Math.floor(rb / 10000) / 100
        const usdbal = bal * 1.78
        $scope.accountDetails.raw_balance = rb
        $scope.accountDetails.balance = window.eztzl.utility.formatMoney(bal, 2, '.', ',') + ' TZL'
        $scope.accountDetails.usd = '$' + window.eztzl.utility.formatMoney(usdbal, 2, '.', ',') + 'USD'
        $scope.accountDetails.loaded = false
      })
    })
  }
  $scope.refresh = function() {
    $scope.loadAccount($scope.account)
  }
  $scope.copy = function() {
    SweetAlert.swal('Awesome!', 'The address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.accounts[$scope.account].address)
  }
  $scope.copyEthereumAddress = function() {
    SweetAlert.swal('Awesome!', 'The ethereum address has been copied to your clipboard', 'success')
    popup.copyToClipboard($scope.ethereumAddress)
  }
  $scope.send = function() {
    const from = $scope.accounts[$scope.account].address
    const to = $scope.toaddress
    const amount = $scope.amount
    const fee = $scope.fee
    const parameters = $scope.parameters
    const type = $scope.type
    return angularEztz.send(from, to, amount, fee, parameters, type)
  }
  $scope.clear = function () {
    $scope.amount = 0
    $scope.fee = config.txFee
    $scope.toaddress = ''
    $scope.parameters = ''
  }
  $scope.mintOTC = function() {
    return (async () => {
      try {
        if (!$scope.isVerified) {
          await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Link Ethereum Address', 'To mint OTC you have to sign your ethereum address.')
            .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
              return tzLibreApi.linkEthAddress(ethAddress, ethAddressSignature, tzlPkh, tzlPk)
            })
        }
        const from = $scope.accounts[$scope.account].address
        const amount = await SweetAlert.askAmountOTCBuy()
        return angularEztz.send(from, config.OTCAddress, amount, config.txFee)
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.activateTZL = function() {
    return (async () => {
      try {
        // @TODO 5.1 (title)
        // @TODO 5.2 (description)
        await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Title1', 'Description1')
          .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
            await tzLibreApi.activateOnTzl(tzlPkh, tzlPk, ethAddress, ethAddressSignature)
            $scope.bookedForTzlActivation = true
            await $scope.refresh()
          })
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.bookForXtzActivation = function() {
    return (async () => {
      try {
        // @TODO 6.1 (title)
        // @TODO 6.2 (description)
        await angularEztz.signEthAddress($scope.type, $scope.ethereumAddress, 'Title2', 'Description2')
          .then(async ({ ethAddress, ethAddressSignature, tzlPkh, tzlPk }) => {
            // @TODO
            await tzLibreApi.bookForTzlActivation(tzlPkh, tzlPk, ethAddress, ethAddressSignature)
            $scope.bookedForXtzActivation = true
          })
      } catch (e) {
        return SweetAlert.swal('Uh-oh!', 'It seems your are not using a valid Ethereum address.')
      }
    })()
  }
  $scope.refresh()
}]
