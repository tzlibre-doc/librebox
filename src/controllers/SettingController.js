import popup from '../helpers/popup'
import config from '../config/config'

export default ['$scope', '$location', 'Storage', 'SweetAlert', function ($scope, $location, Storage, SweetAlert) {
  if (Storage.isWalletEmpty()) {
    $location.path('/new')
  }
  const pathRedirectMain = '/main';
  $scope.setting = Storage.loadSetting()
  $scope.privateKey = ''
  $scope.password = ''

  // BEGIN - FORCE SETTINGS BETANET
  // @TODO: We will have to delete
  Storage.setSetting(config.tzlibre)
  window.eztzl.node.setProvider(config.tzlibre.rpc)
  // END - FORCE SETTINGS BETANET

  $scope.save = function () {
    Storage.setSetting($scope.setting)
    window.eztzl.node.setProvider($scope.setting.rpc)
    $location.path(pathRedirectMain)
  }
  $scope.show = async function () {
    if (!$scope.password) return SweetAlert.swal('Uh-oh!', 'Please enter your password')
    Storage.decryptPrivateKeys($scope.password)
      .then(({ sk }) => {
        $scope.$evalAsync(() => {
          $scope.privateKey = sk
          popup.hideLoader()
        })
      })
      .catch(e => {
        popup.hideLoader()
        SweetAlert.swal('Uh-oh!', 'Incorrect password')
      })
  }
}]
