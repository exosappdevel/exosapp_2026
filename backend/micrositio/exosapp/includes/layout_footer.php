  </main>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
<script src="<?php echo BASE_URL; ?>assets/js/ws_config.php"></script>
<script src="<?php echo BASE_URL; ?>assets/js/common.js"></script>
<?php if (!empty($page_scripts)): foreach ($page_scripts as $s): ?>
<script src="<?php echo BASE_URL . $s; ?>"></script>
<?php endforeach; endif; ?>
</body>
</html>
